'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { AuthError, requireEmployee, requireSession } from '@/lib/auth'
import { checkGeofence, formatDistance, MAX_ACCEPTABLE_ACCURACY_M } from '@/lib/geo'
import { localDateKey } from '@/lib/format'
import type { ActionResult, Attendance, Site } from '@/lib/types'

/** Same threshold the browser uses, re-applied here so the check is authoritative. */
const MATCH_THRESHOLD = 0.5

function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}

/** Turn a thrown guard/Postgres error into a result the UI can render. */
function toResult(err: unknown): ActionResult<never> {
  if (err instanceof AuthError) return fail(err.message)
  console.error('[employee action]', err)
  return fail(err instanceof Error ? err.message : 'Something went wrong.')
}

function parseDescriptor(raw: FormDataEntryValue | null): number[] | null {
  if (typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length !== 128) return null
    return parsed.every((n) => typeof n === 'number' && Number.isFinite(n)) ? parsed : null
  } catch {
    return null
  }
}

function euclidean(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

// ---------------------------------------------------------------------------
// Face enrollment
// ---------------------------------------------------------------------------

export async function enrollFace(formData: FormData): Promise<ActionResult> {
  try {
    const employee = await requireEmployee()
    const descriptor = parseDescriptor(formData.get('descriptor'))
    if (!descriptor) {
      return fail('The face sample was not captured correctly. Please try again.')
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('employees')
      .update({ face_descriptor: descriptor, face_enrolled_at: new Date().toISOString() })
      .eq('id', employee.id)

    if (error) return fail(error.message)

    revalidatePath('/employee')
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Check in / check out
// ---------------------------------------------------------------------------

export async function checkIn(formData: FormData): Promise<
  ActionResult<{ attendance: Attendance; distance: number; matchDistance: number }>
> {
  try {
    const session = await requireSession()
    const employee = await requireEmployee()
    const supabase = await createClient()

    const today = localDateKey()

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .maybeSingle<Attendance>()

    if (existing?.check_in) {
      return fail('You have already checked in today.')
    }

    // --- Location -----------------------------------------------------------
    const lat = Number(formData.get('latitude'))
    const lng = Number(formData.get('longitude'))
    const accuracy = Number(formData.get('accuracy'))

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return fail('Your location could not be read. Enable location access and retry.')
    }
    if (Number.isFinite(accuracy) && accuracy > MAX_ACCEPTABLE_ACCURACY_M) {
      return fail(
        `Location accuracy of ±${Math.round(accuracy)} m is too coarse to confirm you are on site.`,
      )
    }

    if (!employee.site_id) {
      return fail('No work site is assigned to you yet. Ask HR to assign one.')
    }

    const { data: site } = await supabase
      .from('sites')
      .select('*')
      .eq('id', employee.site_id)
      .maybeSingle<Site>()

    if (!site) return fail('Your assigned work site no longer exists. Contact HR.')

    // Re-run the fence server-side. The browser already checked, but a client
    // can send anything, so the authoritative decision has to happen here.
    const fence = checkGeofence({ latitude: lat, longitude: lng, accuracy }, site)
    if (!fence.inside) {
      return fail(
        `You are ${formatDistance(fence.distance)} from ${site.name}, outside its ${site.radius_m} m check-in zone.`,
      )
    }

    // --- Face ---------------------------------------------------------------
    // The descriptor is compared here rather than trusting a client-sent
    // "verified: true" flag, which would be trivial to forge.
    const enrolled = employee.face_descriptor
    if (!enrolled || enrolled.length !== 128) {
      return fail('Enroll your face before checking in.')
    }

    const live = parseDescriptor(formData.get('descriptor'))
    if (!live) return fail('The face scan was incomplete. Please try again.')

    const matchDistance = euclidean(live, enrolled)
    if (matchDistance >= MATCH_THRESHOLD) {
      return fail(
        'Your face did not match the enrolled photo. Face the camera in good light and retry.',
      )
    }

    if (formData.get('liveness') !== 'blink') {
      return fail('Liveness check incomplete — please blink when prompted.')
    }

    // --- Selfie (audit trail; a failure here must not block the check-in) ----
    let selfiePath: string | null = null
    const selfie = formData.get('selfie')
    if (selfie instanceof File && selfie.size > 0) {
      const path = `${session.userId}/${today}-in.jpg`
      const { error: uploadError } = await supabase.storage
        .from('selfies')
        .upload(path, selfie, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) {
        console.warn('[checkIn] selfie upload failed:', uploadError.message)
      } else {
        selfiePath = path
      }
    }

    // --- Persist ------------------------------------------------------------
    // work_minutes, is_late and status are all set by the DB trigger.
    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        {
          employee_id: employee.id,
          date: today,
          check_in: new Date().toISOString(),
          site_id: site.id,
          check_in_lat: lat,
          check_in_lng: lng,
          check_in_accuracy_m: Number.isFinite(accuracy) ? accuracy : null,
          check_in_selfie: selfiePath,
          face_match_score: matchDistance,
        },
        { onConflict: 'employee_id,date' },
      )
      .select()
      .single<Attendance>()

    if (error) return fail(error.message)

    revalidatePath('/employee')
    return { ok: true, data: { attendance: data, distance: fence.distance, matchDistance } }
  } catch (err) {
    return toResult(err)
  }
}

export async function checkOut(formData: FormData): Promise<ActionResult<Attendance>> {
  try {
    const employee = await requireEmployee()
    const supabase = await createClient()
    const today = localDateKey()

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .maybeSingle<Attendance>()

    if (!existing?.check_in) return fail('You have not checked in today.')
    if (existing.check_out) return fail('You have already checked out today.')

    const lat = Number(formData.get('latitude'))
    const lng = Number(formData.get('longitude'))

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: new Date().toISOString(),
        check_out_lat: Number.isFinite(lat) ? lat : null,
        check_out_lng: Number.isFinite(lng) ? lng : null,
      })
      .eq('id', existing.id)
      .select()
      .single<Attendance>()

    if (error) return fail(error.message)

    revalidatePath('/employee')
    return { ok: true, data }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Leaves
// ---------------------------------------------------------------------------

export async function applyLeave(formData: FormData): Promise<ActionResult> {
  try {
    const employee = await requireEmployee()
    const supabase = await createClient()

    const leaveType = String(formData.get('leaveType') ?? '').trim()
    const startDate = String(formData.get('startDate') ?? '')
    const endDate = String(formData.get('endDate') ?? '')
    const reason = String(formData.get('reason') ?? '').trim()

    if (!leaveType) return fail('Choose a leave type.')
    if (!startDate || !endDate) return fail('Pick both a start and an end date.')
    if (endDate < startDate) return fail('The end date cannot be before the start date.')

    // Reject a request that overlaps one already filed, so HR never has to
    // reconcile two competing rows for the same day.
    const { data: clash } = await supabase
      .from('leaves')
      .select('id')
      .eq('employee_id', employee.id)
      .neq('status', 'rejected')
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .limit(1)

    if (clash && clash.length > 0) {
      return fail('You already have a leave request covering some of those dates.')
    }

    const { error } = await supabase.from('leaves').insert({
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
    })

    if (error) return fail(error.message)

    revalidatePath('/employee')
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

export async function cancelLeave(formData: FormData): Promise<ActionResult> {
  try {
    const employee = await requireEmployee()
    const supabase = await createClient()
    const id = String(formData.get('id') ?? '')

    const { error } = await supabase
      .from('leaves')
      .delete()
      .eq('id', id)
      .eq('employee_id', employee.id)
      .eq('status', 'pending')

    if (error) return fail(error.message)

    revalidatePath('/employee')
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateMyProfile(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const employee = await requireEmployee()
    const supabase = await createClient()

    const fullName = String(formData.get('fullName') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()
    const address = String(formData.get('address') ?? '').trim()
    const gender = String(formData.get('gender') ?? '').trim()

    if (!fullName) return fail('Your name cannot be empty.')

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null })
      .eq('id', session.userId)

    if (profileError) return fail(profileError.message)

    const { error: employeeError } = await supabase
      .from('employees')
      .update({
        full_name: fullName,
        phone: phone || null,
        address: address || null,
        gender: gender || null,
      })
      .eq('id', employee.id)

    if (employeeError) return fail(employeeError.message)

    revalidatePath('/employee')
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

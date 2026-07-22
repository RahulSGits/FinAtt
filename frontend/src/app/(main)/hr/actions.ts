'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { AuthError, requireRole } from '@/lib/auth'
import type { ActionResult } from '@/lib/types'

function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}

function toResult(err: unknown): ActionResult<never> {
  if (err instanceof AuthError) return fail(err.message)
  console.error('[hr action]', err)
  return fail(err instanceof Error ? err.message : 'Something went wrong.')
}

function refresh() {
  revalidatePath('/hr')
  revalidatePath('/employee')
}

/**
 * Service-role client for the two operations that genuinely need to bypass RLS:
 * inviting a user and writing their employee row before they have a session.
 * Returns null when the key is absent so callers can explain the gap instead of
 * throwing an opaque "Invalid API key".
 */
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const SERVICE_KEY_HELP =
  'Employee invites need a valid SUPABASE_SERVICE_ROLE_KEY. Copy it from Supabase → Project Settings → API → service_role, put it in frontend/.env.local, and restart the dev server.'

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export async function createEmployee(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')

    const admin = adminClient()
    if (!admin) return fail(SERVICE_KEY_HELP)

    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const fullName = String(formData.get('fullName') ?? '').trim()
    if (!email || !fullName) return fail('Name and email are both required.')

    const phone = String(formData.get('phone') ?? '').trim()
    const department = String(formData.get('department') ?? '').trim()
    const designation = String(formData.get('designation') ?? '').trim()
    const joiningDate = String(formData.get('joiningDate') ?? '')
    const gender = String(formData.get('gender') ?? '')
    const address = String(formData.get('address') ?? '').trim()
    const siteId = String(formData.get('siteId') ?? '')
    const shiftId = String(formData.get('shiftId') ?? '')

    const { data: authData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          role: 'employee',
          phone,
          department,
          designation,
          account_status: 'pending',
          password_created: false,
        },
      })

    if (inviteError) {
      const message = /invalid api key/i.test(inviteError.message)
        ? SERVICE_KEY_HELP
        : inviteError.message
      return fail(message)
    }

    // The profile trigger has already created the employee row; fill in the
    // fields the trigger has no way to know about.
    if (authData.user) {
      const { error } = await admin
        .from('employees')
        .update({
          joining_date: joiningDate || null,
          gender: gender || null,
          address: address || null,
          phone: phone || null,
          department: department || null,
          designation: designation || null,
          site_id: siteId || null,
          shift_id: shiftId || null,
          status: 'active',
        })
        .eq('user_id', authData.user.id)

      if (error) return fail(`Invite sent, but the profile could not be completed: ${error.message}`)
    }

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

export async function updateEmployee(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const id = String(formData.get('id') ?? '')
    if (!id) return fail('Missing employee id.')

    const fullName = String(formData.get('fullName') ?? '').trim()
    if (!fullName) return fail('Name cannot be empty.')

    const { error } = await supabase
      .from('employees')
      .update({
        full_name: fullName,
        phone: String(formData.get('phone') ?? '').trim() || null,
        department: String(formData.get('department') ?? '').trim() || null,
        designation: String(formData.get('designation') ?? '').trim() || null,
        address: String(formData.get('address') ?? '').trim() || null,
        gender: String(formData.get('gender') ?? '') || null,
        status: String(formData.get('status') ?? 'active'),
        site_id: String(formData.get('siteId') ?? '') || null,
        shift_id: String(formData.get('shiftId') ?? '') || null,
      })
      .eq('id', id)

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

/** Wipe an enrollment so the employee can re-register their face. */
export async function resetFaceEnrollment(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()
    const id = String(formData.get('id') ?? '')

    const { error } = await supabase
      .from('employees')
      .update({ face_descriptor: null, face_enrolled_at: null })
      .eq('id', id)

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Leaves
// ---------------------------------------------------------------------------

export async function decideLeave(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole('hr')
    const supabase = await createClient()

    const id = String(formData.get('id') ?? '')
    const decision = String(formData.get('decision') ?? '')
    const note = String(formData.get('note') ?? '').trim()

    if (decision !== 'approved' && decision !== 'rejected') {
      return fail('Decision must be approve or reject.')
    }

    const { data: leave, error: fetchError } = await supabase
      .from('leaves')
      .select('id, employee_id, start_date, end_date, status')
      .eq('id', id)
      .maybeSingle<{
        id: string
        employee_id: string
        start_date: string
        end_date: string
        status: string
      }>()

    if (fetchError) return fail(fetchError.message)
    if (!leave) return fail('That leave request no longer exists.')

    const { error } = await supabase
      .from('leaves')
      .update({
        status: decision,
        decided_by: session.userId,
        decided_at: new Date().toISOString(),
        decision_note: note || null,
      })
      .eq('id', id)

    if (error) return fail(error.message)

    // An approved request should show up on the attendance sheet, otherwise the
    // day reads as an unexplained absence in every report.
    if (decision === 'approved') {
      const days: { employee_id: string; date: string; status: 'leave' }[] = []
      for (
        let d = new Date(`${leave.start_date}T12:00:00`);
        d <= new Date(`${leave.end_date}T12:00:00`);
        d.setDate(d.getDate() + 1)
      ) {
        days.push({
          employee_id: leave.employee_id,
          date: d.toISOString().slice(0, 10),
          status: 'leave',
        })
      }

      const { error: markError } = await supabase
        .from('attendance')
        .upsert(days, { onConflict: 'employee_id,date' })

      if (markError) {
        console.warn('[decideLeave] could not mark attendance as leave:', markError.message)
      }
    }

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export async function createAnnouncement(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole('hr')
    const supabase = await createClient()

    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const priority = String(formData.get('priority') ?? 'normal')

    if (!title) return fail('Give the announcement a title.')
    if (!description) return fail('Announcement body cannot be empty.')

    const { error } = await supabase.from('announcements').insert({
      title,
      description,
      priority: ['low', 'normal', 'high'].includes(priority) ? priority : 'normal',
      created_by: session.userId,
    })

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

export async function deleteAnnouncement(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', String(formData.get('id') ?? ''))

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

export async function saveSite(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const id = String(formData.get('id') ?? '')
    const name = String(formData.get('name') ?? '').trim()
    const latitude = Number(formData.get('latitude'))
    const longitude = Number(formData.get('longitude'))
    const radius = Number(formData.get('radius'))

    if (!name) return fail('The site needs a name.')
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return fail('Latitude must be between -90 and 90.')
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return fail('Longitude must be between -180 and 180.')
    }
    if (!Number.isFinite(radius) || radius < 25 || radius > 5000) {
      return fail('Radius must be between 25 and 5000 metres.')
    }

    const payload = {
      name,
      address: String(formData.get('address') ?? '').trim() || null,
      latitude,
      longitude,
      radius_m: Math.round(radius),
      is_active: formData.get('isActive') !== 'false',
    }

    const { error } = id
      ? await supabase.from('sites').update(payload).eq('id', id)
      : await supabase.from('sites').insert(payload)

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

export async function deleteSite(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', String(formData.get('id') ?? ''))

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Shifts
// ---------------------------------------------------------------------------

export async function saveShift(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const id = String(formData.get('id') ?? '')
    const name = String(formData.get('name') ?? '').trim()
    const startTime = String(formData.get('startTime') ?? '')
    const endTime = String(formData.get('endTime') ?? '')
    const fullDay = Number(formData.get('fullDayMinutes'))
    const halfDay = Number(formData.get('halfDayMinutes'))
    const grace = Number(formData.get('graceMinutes'))
    const workDays = formData
      .getAll('workDays')
      .map((d) => Number(d))
      .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)

    if (!name) return fail('The shift needs a name.')
    if (!startTime || !endTime) return fail('Set both a start and an end time.')
    if (!Number.isFinite(fullDay) || fullDay <= 0) return fail('Full-day minutes must be positive.')
    if (!Number.isFinite(halfDay) || halfDay <= 0) return fail('Half-day minutes must be positive.')
    if (halfDay >= fullDay) {
      return fail('Half-day minutes must be less than full-day minutes.')
    }
    if (workDays.length === 0) return fail('Pick at least one working day.')

    const payload = {
      name,
      start_time: startTime,
      end_time: endTime,
      full_day_minutes: Math.round(fullDay),
      half_day_minutes: Math.round(halfDay),
      grace_minutes: Number.isFinite(grace) ? Math.max(0, Math.round(grace)) : 15,
      work_days: workDays,
      is_active: formData.get('isActive') !== 'false',
    }

    const { error } = id
      ? await supabase.from('shifts').update(payload).eq('id', id)
      : await supabase.from('shifts').insert(payload)

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

export async function deleteShift(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', String(formData.get('id') ?? ''))

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Attendance overrides
// ---------------------------------------------------------------------------

/** Let HR correct a day that the automatic rules got wrong. */
export async function overrideAttendance(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const employeeId = String(formData.get('employeeId') ?? '')
    const date = String(formData.get('date') ?? '')
    const status = String(formData.get('status') ?? '')
    const note = String(formData.get('note') ?? '').trim()

    const allowed = ['present', 'absent', 'half', 'leave', 'off', 'pending']
    if (!employeeId || !date) return fail('Employee and date are both required.')
    if (!allowed.includes(status)) return fail('That is not a valid attendance status.')

    const { error } = await supabase.from('attendance').upsert(
      // manual_override stops the auto-status trigger from recomputing this row
      // back to "absent" on the next write.
      { employee_id: employeeId, date, status, notes: note || null, manual_override: true },
      { onConflict: 'employee_id,date' },
    )

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

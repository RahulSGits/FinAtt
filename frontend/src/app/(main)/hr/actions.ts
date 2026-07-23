'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { AuthError, requireRole } from '@/lib/auth'
import {
  emailConfigured,
  EMAIL_SETUP_HELP,
  sendInviteEmail,
  sendLeaveDecisionEmail,
  sendTestEmail,
  usingSandboxSender,
} from '@/lib/email'
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

/** Absolute origin used to build links inside emails. */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

/**
 * HR-facing wording only. The specific env var and dashboard path are
 * infrastructure detail and live on the admin console's Diagnostics tab; naming
 * them here would put them in an HR user's payload.
 */
const SERVICE_KEY_HELP =
  'Invite emails are not enabled on this deployment yet. Your administrator can turn them on from the admin console. In the meantime, create a login for this employee directly, or ask them to register with their work email.'

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

/** Shape accepted by both the single-employee form and the CSV importer. */
interface EmployeeInput {
  email: string
  fullName: string
  phone?: string
  department?: string
  designation?: string
  joiningDate?: string
  gender?: string
  address?: string
  siteId?: string
  shiftId?: string
}

function readEmployeeInput(formData: FormData): EmployeeInput {
  return {
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    fullName: String(formData.get('fullName') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    department: String(formData.get('department') ?? '').trim(),
    designation: String(formData.get('designation') ?? '').trim(),
    joiningDate: String(formData.get('joiningDate') ?? ''),
    gender: String(formData.get('gender') ?? ''),
    address: String(formData.get('address') ?? '').trim(),
    siteId: String(formData.get('siteId') ?? ''),
    shiftId: String(formData.get('shiftId') ?? ''),
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Next sequential employee code, e.g. EMP-0007. */
async function nextEmployeeCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offset = 0,
): Promise<string> {
  const { data } = await supabase
    .from('employees')
    .select('employee_id')
    .order('employee_id', { ascending: false })
    .limit(1)
    .maybeSingle<{ employee_id: string }>()

  const highest = Number((data?.employee_id ?? '').replace(/\D/g, '')) || 0
  return `EMP-${String(highest + 1 + offset).padStart(4, '0')}`
}

/**
 * Create an employee record.
 *
 * Deliberately does NOT require the service_role key: the row is written
 * straight to `employees` with a null user_id, which HR's own RLS policy
 * permits. When that person later signs up with the same address, the
 * handle_new_profile trigger adopts the row. Sending the invite email is a
 * separate, optional step so a missing key or SMTP outage cannot block
 * onboarding.
 */
export async function createEmployee(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()
    const input = readEmployeeInput(formData)

    if (!input.fullName) return fail('Enter the employee\'s full name.')
    if (!EMAIL_RE.test(input.email)) return fail('Enter a valid email address.')

    const { data: clash } = await supabase
      .from('employees')
      .select('id')
      .ilike('email', input.email)
      .maybeSingle<{ id: string }>()

    if (clash) return fail('An employee with that email already exists.')

    const { error } = await supabase.from('employees').insert({
      employee_id: await nextEmployeeCode(supabase),
      full_name: input.fullName,
      email: input.email,
      phone: input.phone || null,
      department: input.department || null,
      designation: input.designation || null,
      joining_date: input.joiningDate || null,
      gender: input.gender || null,
      address: input.address || null,
      site_id: input.siteId || null,
      shift_id: input.shiftId || null,
      status: 'active',
    })

    if (error) return fail(error.message)

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

/**
 * Create a sign-in account for an employee who does not have one yet, and hand
 * HR a temporary password to pass on.
 *
 * Two routes, because they degrade differently:
 *
 *  - service_role present -> `admin.createUser({ email_confirm: true })`. The
 *    account is usable immediately, no email involved.
 *  - otherwise -> plain `signUp()` on a cookie-less client, which needs only the
 *    publishable key. The account is created but Supabase requires the employee
 *    to confirm by email first (this project has mailer_autoconfirm off), so we
 *    say so rather than handing over a password that will not work yet.
 *
 * A cookie-less client is essential: the SSR client would write the new user's
 * tokens into HR's own cookies and sign HR out of their own console.
 */
export async function createEmployeeLogin(
  formData: FormData,
): Promise<ActionResult<{ email: string; password: string; needsConfirmation: boolean }>> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const employeeId = String(formData.get('employeeId') ?? '')
    if (!employeeId) return fail('Missing employee.')

    const { data: employee, error: lookupError } = await supabase
      .from('employees')
      .select('id, email, full_name, user_id, department, designation, phone')
      .eq('id', employeeId)
      .maybeSingle<{
        id: string
        email: string
        full_name: string
        user_id: string | null
        department: string | null
        designation: string | null
        phone: string | null
      }>()

    if (lookupError) return fail(lookupError.message)
    if (!employee) return fail('That employee no longer exists.')
    if (employee.user_id) {
      return fail(`${employee.full_name} already has an account. Send a password reset instead.`)
    }

    const supplied = String(formData.get('password') ?? '')
    const password = supplied.length >= 8 ? supplied : generatePassword()

    const metadata = {
      full_name: employee.full_name,
      role: 'employee',
      phone: employee.phone ?? '',
      department: employee.department ?? '',
      designation: employee.designation ?? '',
      account_status: 'active',
      // Forces /set-password on first sign-in so the temporary one is replaced.
      password_created: false,
    }

    const admin = adminClient()

    if (admin) {
      const { error } = await admin.auth.admin.createUser({
        email: employee.email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      })

      if (error) {
        return fail(
          /invalid api key/i.test(error.message) ? SERVICE_KEY_HELP : error.message,
        )
      }

      refresh()
      return { ok: true, data: { email: employee.email, password, needsConfirmation: false } }
    }

    // Fallback: no service key. `signUp` only needs the publishable key.
    const anon = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data, error } = await anon.auth.signUp({
      email: employee.email,
      password,
      options: { data: metadata, emailRedirectTo: `${siteUrl()}/auth/callback` },
    })

    if (error) {
      return fail(
        /already registered/i.test(error.message)
          ? 'An account already exists for that email address.'
          : error.message,
      )
    }

    refresh()
    return {
      ok: true,
      data: {
        email: employee.email,
        password,
        // No session back means Supabase is holding the account for confirmation.
        needsConfirmation: !data.session,
      },
    }
  } catch (err) {
    return toResult(err)
  }
}

/** Email an existing account a password-reset link. */
export async function sendPasswordReset(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return fail('That is not a valid email address.')

    const anon = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { error } = await anon.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback`,
    })

    if (error) return fail(error.message)
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}

/**
 * Readable but high-entropy temporary password: ~62 bits, no ambiguous glyphs
 * (0/O, 1/l/I) so it survives being read aloud or copied off a screen.
 */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint32Array(12)
  crypto.getRandomValues(bytes)
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  return `${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`
}

/** Bulk-create employees from a parsed CSV. Partial success is reported, not thrown. */
export async function importEmployees(
  rows: EmployeeInput[],
): Promise<ActionResult<{ created: number; skipped: { email: string; reason: string }[] }>> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    if (!Array.isArray(rows) || rows.length === 0) return fail('No rows to import.')
    if (rows.length > 500) return fail('Import at most 500 employees at a time.')

    const skipped: { email: string; reason: string }[] = []

    const { data: existing } = await supabase.from('employees').select('email')
    const taken = new Set((existing ?? []).map((e) => String(e.email).toLowerCase()))

    const valid: EmployeeInput[] = []
    for (const row of rows) {
      const email = (row.email ?? '').trim().toLowerCase()
      const fullName = (row.fullName ?? '').trim()

      if (!EMAIL_RE.test(email)) {
        skipped.push({ email: email || '(blank)', reason: 'Invalid email' })
      } else if (!fullName) {
        skipped.push({ email, reason: 'Missing name' })
      } else if (taken.has(email)) {
        skipped.push({ email, reason: 'Already on the roster' })
      } else {
        taken.add(email)
        valid.push({ ...row, email, fullName })
      }
    }

    if (valid.length === 0) {
      return { ok: true, data: { created: 0, skipped } }
    }

    // One code per row, allocated up front so the batch stays contiguous.
    const base = await nextEmployeeCode(supabase)
    const start = Number(base.replace(/\D/g, ''))

    const payload = valid.map((row, i) => ({
      employee_id: `EMP-${String(start + i).padStart(4, '0')}`,
      full_name: row.fullName,
      email: row.email,
      phone: row.phone || null,
      department: row.department || null,
      designation: row.designation || null,
      joining_date: row.joiningDate || null,
      site_id: row.siteId || null,
      shift_id: row.shiftId || null,
      status: 'active',
    }))

    const { error, count } = await supabase
      .from('employees')
      .insert(payload, { count: 'exact' })

    if (error) return fail(error.message)

    refresh()
    return { ok: true, data: { created: count ?? payload.length, skipped } }
  } catch (err) {
    return toResult(err)
  }
}

/**
 * Email a password-setup link to employees who have no account yet.
 *
 * Needs the service_role key (only the auth admin API can mint a link) and a
 * configured Resend key. Both are checked up front so the failure is a clear
 * sentence instead of a provider stack trace.
 */
export async function sendInvites(
  employeeIds: string[],
): Promise<ActionResult<{ sent: number; failed: { email: string; reason: string }[] }>> {
  try {
    const session = await requireRole('hr')
    const supabase = await createClient()

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return fail('Select at least one employee to invite.')
    }

    const admin = adminClient()
    if (!admin) return fail(SERVICE_KEY_HELP)
    if (!emailConfigured()) return fail(EMAIL_SETUP_HELP)

    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, email, full_name, user_id')
      .in('id', employeeIds)

    if (error) return fail(error.message)
    if (!employees?.length) return fail('Those employees no longer exist.')

    const appUrl = siteUrl()
    const failed: { email: string; reason: string }[] = []
    let sent = 0

    for (const employee of employees) {
      // Already has an account -> a recovery link; otherwise a fresh invite.
      const type = employee.user_id ? 'recovery' : 'invite'

      const { data: link, error: linkError } = await admin.auth.admin.generateLink({
        type: type as 'invite' | 'recovery',
        email: employee.email,
        options: {
          redirectTo: `${appUrl}/auth/callback`,
          ...(type === 'invite'
            ? { data: { full_name: employee.full_name, role: 'employee', password_created: false } }
            : {}),
        },
      })

      if (linkError || !link?.properties?.action_link) {
        failed.push({
          email: employee.email,
          reason: /invalid api key/i.test(linkError?.message ?? '')
            ? 'Service role key rejected'
            : (linkError?.message ?? 'Could not generate a link'),
        })
        continue
      }

      const result = await sendInviteEmail({
        to: employee.email,
        name: employee.full_name,
        link: link.properties.action_link,
        invitedBy: session.name,
      })

      if (result.ok) sent += 1
      else failed.push({ email: employee.email, reason: result.error ?? 'Send failed' })
    }

    refresh()
    return { ok: true, data: { sent, failed } }
  } catch (err) {
    return toResult(err)
  }
}

/** Whether the HR console should offer the "send invite" affordance at all. */
export async function getEmailCapability(): Promise<{
  email: boolean
  serviceKey: boolean
}> {
  return { email: emailConfigured(), serviceKey: adminClient() !== null }
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

/**
 * Grant an employee another face registration.
 *
 * Clears the stored template AND resets the attempt counter — resetting only
 * the template would leave them locked out, since the portal refuses once the
 * allowance is spent.
 */
export async function resetFaceEnrollment(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole('hr')
    const supabase = await createClient()
    const id = String(formData.get('id') ?? '')
    if (!id) return fail('Missing employee.')

    const { error } = await supabase
      .from('employees')
      .update({
        face_descriptor: null,
        face_enrolled_at: null,
        face_enroll_attempts: 0,
        face_enroll_granted_at: new Date().toISOString(),
        face_enroll_granted_by: session.userId,
      })
      .eq('id', id)

    if (error) {
      return fail(
        /face_enroll_attempts/i.test(error.message)
          ? 'Run the face-attempt migration first — the console shows it under Diagnostics.'
          : error.message,
      )
    }

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
      .select('id, employee_id, start_date, end_date, status, leave_type, employees(email, full_name)')
      .eq('id', id)
      .maybeSingle<{
        id: string
        employee_id: string
        start_date: string
        end_date: string
        status: string
        leave_type: string
        employees: { email: string; full_name: string } | null
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

    // Notify the employee. Email is best-effort: the decision is already
    // committed, so a provider outage must not surface as a failed approval.
    if (leave.employees?.email && emailConfigured()) {
      const mail = await sendLeaveDecisionEmail({
        to: leave.employees.email,
        name: leave.employees.full_name,
        decision,
        leaveType: leave.leave_type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        note: note || null,
        appUrl: siteUrl(),
      })
      if (!mail.ok) console.warn('[decideLeave] notification email failed:', mail.error)
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
    const kind = String(formData.get('kind') ?? 'office')
    const rawLat = String(formData.get('latitude') ?? '')
    const rawLng = String(formData.get('longitude') ?? '')
    const radius = Number(formData.get('radius'))

    if (!name) return fail('The site needs a name.')
    if (!['office', 'remote', 'hybrid'].includes(kind)) {
      return fail('Pick a valid site type.')
    }

    // A remote site has nowhere to fence, so coordinates are optional — but an
    // office without them would silently accept check-ins from anywhere.
    const hasCoords = rawLat !== '' && rawLng !== ''
    const latitude = hasCoords ? Number(rawLat) : null
    const longitude = hasCoords ? Number(rawLng) : null

    if (kind === 'office' && !hasCoords) {
      return fail('An office needs a location. Place it on the map first.')
    }
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      return fail('Latitude must be between -90 and 90.')
    }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      return fail('Longitude must be between -180 and 180.')
    }
    if (!Number.isFinite(radius) || radius < 25 || radius > 5000) {
      return fail('Radius must be between 25 and 5000 metres.')
    }

    const payload = {
      name,
      kind,
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
    const workMode = String(formData.get('workMode') ?? 'on_site')
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
    if (!['on_site', 'remote', 'hybrid'].includes(workMode)) {
      return fail('Pick a valid work mode.')
    }

    const payload = {
      name,
      start_time: startTime,
      end_time: endTime,
      full_day_minutes: Math.round(fullDay),
      half_day_minutes: Math.round(halfDay),
      grace_minutes: Number.isFinite(grace) ? Math.max(0, Math.round(grace)) : 15,
      work_days: workDays,
      work_mode: workMode,
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

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

/**
 * Send a one-off test email so email configuration can be verified from the
 * console rather than by inviting a real employee and hoping.
 */
export async function sendDiagnosticEmail(
  formData: FormData,
): Promise<ActionResult<{ id?: string; sandbox: boolean }>> {
  try {
    const session = await requireRole('hr')
    if (!emailConfigured()) return fail(EMAIL_SETUP_HELP)

    // Default to the signed-in user: with Resend's sandbox sender that is the
    // only address likely to be accepted anyway.
    const to = String(formData.get('to') ?? '').trim() || session.email
    if (!EMAIL_RE.test(to)) return fail('Enter a valid email address.')

    const result = await sendTestEmail(to)
    if (!result.ok) return fail(result.error ?? 'Send failed.')

    return { ok: true, data: { id: result.id, sandbox: usingSandboxSender() } }
  } catch (err) {
    return toResult(err)
  }
}

// ---------------------------------------------------------------------------
// Employee removal
// ---------------------------------------------------------------------------

export interface EmployeeImpact {
  attendance: number
  leaves: number
  hasLogin: boolean
  faceEnrolled: boolean
}

/**
 * What removing this employee would destroy.
 *
 * `attendance` and `leaves` are ON DELETE CASCADE from `employees`, so a delete
 * silently takes their whole history with it. The confirmation dialog shows
 * these counts rather than a generic "are you sure".
 */
export async function getEmployeeImpact(
  employeeId: string,
): Promise<ActionResult<EmployeeImpact>> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const [attendanceRes, leavesRes, employeeRes] = await Promise.all([
      supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', employeeId),
      supabase
        .from('leaves')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', employeeId),
      supabase
        .from('employees')
        .select('user_id, face_descriptor')
        .eq('id', employeeId)
        .maybeSingle<{ user_id: string | null; face_descriptor: unknown }>(),
    ])

    return {
      ok: true,
      data: {
        attendance: attendanceRes.count ?? 0,
        leaves: leavesRes.count ?? 0,
        hasLogin: Boolean(employeeRes.data?.user_id),
        faceEnrolled: Boolean(employeeRes.data?.face_descriptor),
      },
    }
  } catch (err) {
    return toResult(err)
  }
}

/**
 * Permanently remove an employee and, by cascade, their attendance and leave
 * records. For someone who has simply left, set their status to `inactive` on
 * the edit form instead — that keeps the history intact for reporting.
 *
 * The linked auth user is left alone: deleting it needs the service_role key,
 * and orphaning the login is far less damaging than failing halfway through.
 */
export async function deleteEmployee(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole('hr')
    const supabase = await createClient()

    const id = String(formData.get('id') ?? '')
    if (!id) return fail('Missing employee.')

    const { data: employee } = await supabase
      .from('employees')
      .select('full_name, user_id')
      .eq('id', id)
      .maybeSingle<{ full_name: string; user_id: string | null }>()

    if (!employee) return fail('That employee no longer exists.')

    // Typed-name confirmation: this is unrecoverable from the UI.
    const typed = String(formData.get('confirmName') ?? '').trim()
    if (typed.toLowerCase() !== employee.full_name.trim().toLowerCase()) {
      return fail('The name you typed does not match. Nothing was deleted.')
    }

    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) return fail(error.message)

    if (employee.user_id) {
      // The sign-in survives; note it so HR is not surprised later.
      console.warn(
        `[deleteEmployee] ${employee.full_name} removed, but their auth account remains. ` +
          'Delete it from Supabase → Authentication → Users if they should lose access.',
      )
    }

    refresh()
    return { ok: true }
  } catch (err) {
    return toResult(err)
  }
}


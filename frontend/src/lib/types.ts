/** Row shapes mirroring supabase/migrations/20260721000000_finatt_full_schema.sql */

export type Role = 'hr' | 'employee'

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half'
  | 'late'
  | 'leave'
  | 'pending'
  | 'off'

export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export type Priority = 'low' | 'normal' | 'high'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  phone: string | null
  department: string | null
  designation: string | null
  profile_image: string | null
  account_status: string | null
  password_created: boolean | null
  created_at: string
}

export interface Site {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  radius_m: number
  is_active: boolean
  created_at: string
}

export interface Shift {
  id: string
  name: string
  /** `HH:MM:SS` in the site's local time. */
  start_time: string
  end_time: string
  grace_minutes: number
  full_day_minutes: number
  half_day_minutes: number
  /** ISO weekday numbers, 1 = Monday .. 7 = Sunday. */
  work_days: number[]
  is_active: boolean
  created_at: string
}

export interface Employee {
  id: string
  user_id: string
  employee_id: string
  full_name: string
  email: string
  phone: string | null
  department: string | null
  designation: string | null
  joining_date: string | null
  gender: string | null
  address: string | null
  status: string
  profile_image: string | null
  site_id: string | null
  shift_id: string | null
  /** 128-float face-api descriptor captured at enrollment. */
  face_descriptor: number[] | null
  face_enrolled_at: string | null
  created_at: string
}

/** Employee joined with its assigned site and shift. */
export interface EmployeeWithAssignment extends Employee {
  sites: Site | null
  shifts: Shift | null
}

export interface Attendance {
  id: string
  employee_id: string
  check_in: string | null
  check_out: string | null
  date: string
  status: AttendanceStatus
  site_id: string | null
  check_in_lat: number | null
  check_in_lng: number | null
  check_in_accuracy_m: number | null
  check_out_lat: number | null
  check_out_lng: number | null
  /** Storage object path in the private `selfies` bucket. */
  check_in_selfie: string | null
  face_match_score: number | null
  work_minutes: number
  is_late: boolean
  /** True when HR set the status by hand; suppresses the auto-status trigger. */
  manual_override: boolean
  notes: string | null
  created_at: string
}

export interface AttendanceWithEmployee extends Attendance {
  employees: Pick<Employee, 'id' | 'full_name' | 'employee_id' | 'department'> | null
}

export interface Leave {
  id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string | null
  status: LeaveStatus
  decided_by: string | null
  decided_at: string | null
  decision_note: string | null
  created_at: string
}

export interface LeaveWithEmployee extends Leave {
  employees: Pick<Employee, 'id' | 'full_name' | 'employee_id' | 'department'> | null
}

export interface Announcement {
  id: string
  title: string
  description: string
  priority: Priority
  created_by: string | null
  created_at: string
}

/** Discriminated result returned by every server action. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: never } : { data: T }))
  | { ok: false; error: string }

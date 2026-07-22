import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'
import { localDateKey } from '@/lib/format'
import HrDashboardClient from './HrDashboardClient'
import type {
  Announcement,
  AttendanceWithEmployee,
  EmployeeWithAssignment,
  LeaveWithEmployee,
  Shift,
  Site,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

/** Days of attendance history loaded for the console's charts and tables. */
const HISTORY_DAYS = 60

export default async function HrPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'hr') redirect('/employee')

  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - HISTORY_DAYS)

  const [employeesRes, attendanceRes, leavesRes, announcementsRes, sitesRes, shiftsRes] =
    await Promise.all([
      supabase
        .from('employees')
        .select('*, sites(*), shifts(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('attendance')
        .select('*, employees(id, full_name, employee_id, department)')
        .gte('date', localDateKey(since))
        .order('date', { ascending: false }),
      supabase
        .from('leaves')
        .select('*, employees(id, full_name, employee_id, department)')
        .order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('sites').select('*').order('created_at'),
      supabase.from('shifts').select('*').order('start_time'),
    ])

  return (
    <HrDashboardClient
      userProfile={{ id: session.userId, name: session.name, role: 'hr' }}
      employees={(employeesRes.data ?? []) as EmployeeWithAssignment[]}
      attendance={(attendanceRes.data ?? []) as AttendanceWithEmployee[]}
      leaves={(leavesRes.data ?? []) as LeaveWithEmployee[]}
      announcements={(announcementsRes.data ?? []) as Announcement[]}
      sites={(sitesRes.data ?? []) as Site[]}
      shifts={(shiftsRes.data ?? []) as Shift[]}
      loadError={employeesRes.error?.message ?? null}
    />
  )
}

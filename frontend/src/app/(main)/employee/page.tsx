import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EmployeeDashboardClient from './EmployeeDashboardClient'

export default async function EmployeePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fallback to user_metadata if profile query fails (e.g. RLS issues)
  const role = profile?.role || user.user_metadata?.role || 'employee'
  if (profileError) {
    console.warn('Profile fetch failed on Employee page, using metadata fallback:', profileError.message)
  }

  if (role !== 'employee') {
    redirect('/hr')
  }
  
  // Fetch employee record
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .single()
    
  const employeeId = employee?.id
  
  let attendance = []
  let leaves = []
  
  if (employeeId) {
    const { data: attData } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', { ascending: false })
      .limit(30)
    attendance = attData || []
    
    const { data: leavesData } = await supabase
      .from('leaves')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false })
    leaves = leavesData || []
  }
    
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <EmployeeDashboardClient 
      userProfile={{ id: user.id, name: profile?.full_name || user.user_metadata?.full_name || user.email || 'Employee', role: role }}
      employeeData={employee || {}}

      initialAnnouncements={announcements || []}
    />
  )
}

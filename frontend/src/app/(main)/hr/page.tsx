import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HrDashboardClient from './HrDashboardClient'

export default async function HrPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'hr') {
    redirect('/employee')
  }
  
  // Fetch required data
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })
    
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*, employees(full_name)')
    
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <HrDashboardClient 
      userProfile={{ id: user.id, name: profile.full_name, role: profile.role }}
      initialEmployees={employees || []}
      initialAttendance={attendance || []}
      initialAnnouncements={announcements || []}
    />
  )
}

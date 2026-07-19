import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HrDashboardClient from './HrDashboardClient'

export default async function HrPage() {
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
    console.warn('Profile fetch failed on HR page, using metadata fallback:', profileError.message)
  }

  if (role !== 'hr') {
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
      userProfile={{ id: user.id, name: profile?.full_name || user.user_metadata?.full_name || user.email || 'HR User', role: role }}
      initialEmployees={employees || []}

      initialAnnouncements={announcements || []}
    />
  )
}

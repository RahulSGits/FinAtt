import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SetPasswordForm from './SetPasswordForm'

export default async function SetPasswordPage() {
  const supabase = await createClient()

  // Verify the user is authenticated (via the invite link)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify that the user actually needs to set a password
  const { data: profile } = await supabase
    .from('profiles')
    .select('password_created')
    .eq('id', user.id)
    .single()

  if (profile?.password_created) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Create Password</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Welcome! Please set a secure password for your new account to continue.
          </p>
        </div>
        
        <SetPasswordForm />
      </div>
    </div>
  )
}

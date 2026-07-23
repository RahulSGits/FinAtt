import { redirect } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import SetPasswordForm from './SetPasswordForm'

export const dynamic = 'force-dynamic'

export default async function SetPasswordPage() {
  const supabase = await createClient()

  // Reaching this page requires the session created by the invite link.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, password_created')
    .eq('id', user.id)
    .maybeSingle<{ role: string; password_created: boolean | null }>()

  // Already set up — send them on rather than letting them reset by accident.
  if (profile?.password_created) {
    redirect(
      profile.role === 'admin' ? '/admin' : profile.role === 'hr' ? '/hr' : '/employee',
    )
  }

  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center">
          <span
            className="mx-auto grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <KeyRound size={22} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Set your password</h1>
          <p className="muted mt-2 text-sm">
            Welcome to FinAtt. Choose a password to finish setting up your account.
          </p>
        </div>

        <SetPasswordForm />
      </div>
    </div>
  )
}

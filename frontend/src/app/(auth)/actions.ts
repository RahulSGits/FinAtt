'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Role } from '@/lib/types'

export interface AuthActionState {
  error?: string
  /** Set when the account was created but still needs email confirmation. */
  needsConfirmation?: boolean
}

const MIN_PASSWORD_LENGTH = 8

function landingFor(role: Role): string {
  return role === 'hr' ? '/hr' : '/employee'
}

export async function login(formData: FormData): Promise<AuthActionState> {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Enter both your email and password.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Supabase returns the same generic message for a bad password and an
    // unknown address, which is correct — it stops the form being used to
    // enumerate who has an account.
    return {
      error: /invalid login/i.test(error.message)
        ? 'That email and password combination is not recognised.'
        : error.message,
    }
  }

  if (!data.user) return { error: 'Sign-in did not complete. Please try again.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, password_created')
    .eq('id', data.user.id)
    .maybeSingle<{ role: Role; password_created: boolean | null }>()

  const role = (profile?.role ?? data.user.user_metadata?.role ?? 'employee') as Role
  const passwordCreated =
    profile?.password_created ?? data.user.user_metadata?.password_created ?? true

  // redirect() throws to unwind, so nothing after it runs.
  redirect(passwordCreated === false ? '/set-password' : landingFor(role))
}

export async function register(formData: FormData): Promise<AuthActionState> {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const fullName = String(formData.get('fullName') ?? '').trim()
  const role = String(formData.get('role') ?? 'employee') as Role

  if (!fullName) return { error: 'Enter your full name.' }
  if (!email) return { error: 'Enter your email address.' }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (password !== confirmPassword) return { error: 'The two passwords do not match.' }
  if (role !== 'hr' && role !== 'employee') return { error: 'Pick a valid account role.' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        phone: String(formData.get('phone') ?? '').trim(),
        department: String(formData.get('department') ?? '').trim(),
        designation: String(formData.get('designation') ?? '').trim(),
        account_status: 'active',
        password_created: true,
      },
    },
  })

  if (error) {
    return {
      error: /already registered/i.test(error.message)
        ? 'An account already exists for that email. Try signing in instead.'
        : error.message,
    }
  }

  // With email confirmation switched on, signUp returns a user but no session.
  // Telling the user to check their inbox beats bouncing them to a login form
  // that will reject them.
  if (data.user && !data.session) return { needsConfirmation: true }

  redirect(landingFor(role))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function setupPassword(formData: FormData): Promise<AuthActionState> {
  const supabase = await createClient()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  if (confirmPassword && password !== confirmPassword) {
    return { error: 'The two passwords do not match.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Your invite link has expired. Ask HR to send a new one.' }
  }

  const { error: authError } = await supabase.auth.updateUser({ password })
  if (authError) return { error: authError.message }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ password_created: true, account_status: 'active' })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: Role }>()

  redirect(landingFor(profile?.role ?? 'employee'))
}

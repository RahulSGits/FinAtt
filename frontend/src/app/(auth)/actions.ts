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

/**
 * Retry a network-level failure once.
 *
 * Supabase sits behind Cloudflare and a connect attempt occasionally stalls
 * until undici's 10s timeout, surfacing as a bare `TypeError: fetch failed`.
 * It is transient — the following attempt typically completes in under half a
 * second — so one retry converts a dead-end error into a slightly slow sign-in.
 * Only network faults are retried; a rejected password must not be re-sent.
 */
async function withNetworkRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (err) {
    if (!isNetworkError(err)) throw err
    console.warn('[auth] network fault reaching Supabase, retrying once:', describeCause(err))
    await new Promise((r) => setTimeout(r, 400))
    return operation()
  }
}

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const text = `${err.message} ${describeCause(err)}`
  return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|UND_ERR|socket hang up|network/i.test(
    text,
  )
}

function describeCause(err: unknown): string {
  const cause = (err as { cause?: unknown })?.cause
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`
  return typeof cause === 'string' ? cause : ''
}

/**
 * Turn a Supabase auth failure into something a human can act on.
 *
 * `error.message` is not always usable: when GoTrue returns a 500 whose body
 * the client cannot parse, supabase-js hands back the literal string "{}",
 * which previously rendered as an empty red box on the sign-in form.
 */
function describeAuthError(error: { message?: string; status?: number; code?: string }): string {
  const message = (error.message ?? '').trim()
  const useless = message === '' || message === '{}' || message === '[object Object]'

  // A transport failure is not an authentication failure; saying "fetch failed"
  // to someone typing a password is actively misleading.
  if (isNetworkError(error as unknown) || /fetch failed|UND_ERR|ETIMEDOUT/i.test(message)) {
    return 'Could not reach the authentication service. Check your connection and try again in a moment.'
  }

  // The same generic text for a wrong password and an unknown address is
  // deliberate — it stops the form being used to enumerate who has an account.
  if (/invalid login/i.test(message)) {
    return 'That email and password combination is not recognised.'
  }

  if (/email not confirmed/i.test(message)) {
    return 'This account still needs to confirm its email address. Check the inbox for the confirmation link.'
  }

  if (/database error querying schema/i.test(message) || (useless && error.status === 500)) {
    // An auth.users row with no matching auth.identities row — the signature of
    // an account inserted by raw SQL rather than created through signup.
    // Deliberately offers the no-SQL route first: most people reading this are
    // not going to open a database console.
    return (
      "This account's sign-in record is incomplete on the server, so it can never " +
      'authenticate — the password is not the problem. Ask an administrator to either ' +
      'create you a fresh login from the HR console, or repair this one. ' +
      '(Reference: HTTP 500 "Database error querying schema".)'
    )
  }

  if (useless) {
    return `Sign-in failed${error.status ? ` (HTTP ${error.status})` : ''}. Check the server logs for details.`
  }

  return message
}

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

  let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']
  try {
    const result = await withNetworkRetry(() =>
      supabase.auth.signInWithPassword({ email, password }),
    )
    if (result.error) return { error: describeAuthError(result.error) }
    data = result.data
  } catch (err) {
    // Both attempts hit the network, so the credentials were never checked.
    return { error: describeAuthError({ message: err instanceof Error ? err.message : '' }) }
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

  // Stamp the sign-in for the admin portal's activity stats. Best-effort: a
  // failure here must never block someone getting into the app.
  const { error: statError } = await supabase.rpc('record_login')
  if (statError) console.warn('[login] could not record sign-in:', statError.message)

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

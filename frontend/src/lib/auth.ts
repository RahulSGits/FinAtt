/** Server-side session and role guards. Import only from server code. */

import { createClient } from '@/utils/supabase/server'
import type { Employee, Profile, Role } from './types'

export interface Session {
  userId: string
  email: string
  profile: Profile | null
  role: Role
  name: string
}

/**
 * Resolve the signed-in user and their role.
 *
 * `profiles` is the source of truth, but `user_metadata` is kept as a fallback:
 * it is written at signup and survives a transient RLS or network failure, so a
 * hiccup degrades to a correct-but-stale role rather than locking the user out.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (error) {
    console.warn('[auth] profile lookup failed, falling back to metadata:', error.message)
  }

  const role = (profile?.role ?? user.user_metadata?.role ?? 'employee') as Role

  return {
    userId: user.id,
    email: user.email ?? '',
    profile: profile ?? null,
    role,
    name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'User',
  }
}

export class AuthError extends Error {}

/** Throw unless someone is signed in. */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new AuthError('You are not signed in.')
  return session
}

/** Throw unless the signed-in user holds `role`. */
export async function requireRole(role: Role): Promise<Session> {
  const session = await requireSession()
  if (session.role !== role) {
    throw new AuthError(`This action requires the ${role} role.`)
  }
  return session
}

/** The `employees` row belonging to the signed-in user, if there is one. */
export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<Employee>()

  return data ?? null
}

/** Throw unless the signed-in user has an employee record. */
export async function requireEmployee(): Promise<Employee> {
  const employee = await getCurrentEmployee()
  if (!employee) {
    throw new AuthError(
      'No employee record is linked to your account. Ask HR to complete your onboarding.',
    )
  }
  return employee
}

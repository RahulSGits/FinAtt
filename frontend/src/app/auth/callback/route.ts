import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Exchanges the code from an invite or magic link for a session, then routes
 * the user to the right place.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(`${origin}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, password_created')
    .eq('id', user.id)
    .maybeSingle<{ role: string; password_created: boolean | null }>()

  if (profile?.password_created === false) {
    return NextResponse.redirect(`${origin}/set-password`)
  }

  const role = profile?.role ?? user.user_metadata?.role ?? 'employee'
  return NextResponse.redirect(`${origin}${safeNext(searchParams.get('next'), role)}`)
}

/**
 * Only ever redirect to a path on this site.
 *
 * `next` arrives from the URL, so accepting it verbatim would let a crafted
 * link bounce a freshly-authenticated user to an attacker's page. Anything
 * that isn't a single-slash relative path falls back to the role's dashboard.
 */
function safeNext(next: string | null, role: string): string {
  const fallback = role === 'hr' ? '/hr' : '/employee'
  if (!next) return fallback
  // Rejects absolute URLs ("https://evil.com") and protocol-relative ("//evil.com").
  if (!next.startsWith('/') || next.startsWith('//')) return fallback
  return next
}

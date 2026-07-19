import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh the session if expired.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register')

  // If user is not logged in and tries to access a protected route
  if (!user && !isAuthRoute && path !== '/' && path !== '/demo') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, fetch their role
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, password_created')
      .eq('id', user.id)
      .single()

    // Fallback to user_metadata if profile query fails (e.g. RLS issues)
    const role = profile?.role || user.user_metadata?.role || 'employee'
    const passwordCreated = profile?.password_created ?? user.user_metadata?.password_created ?? true

    if (profileError) {
      console.warn('Middleware: profile fetch failed, using metadata fallback:', profileError.message)
    }

    // If password is not created, force to /set-password
    if (passwordCreated === false && path !== '/set-password' && path !== '/auth/callback') {
      const url = request.nextUrl.clone()
      url.pathname = '/set-password'
      return NextResponse.redirect(url)
    }

    // Redirect if they try to access auth routes while logged in
    if (isAuthRoute) {
      if (passwordCreated === false) {
        const url = request.nextUrl.clone()
        url.pathname = '/set-password'
        return NextResponse.redirect(url)
      }
      const url = request.nextUrl.clone()
      url.pathname = role === 'hr' ? '/hr' : '/employee'
      return NextResponse.redirect(url)
    }

    // Role-based protection
    if (path.startsWith('/hr') && role !== 'hr') {
      const url = request.nextUrl.clone()
      url.pathname = '/employee'
      return NextResponse.redirect(url)
    }
    
    if (path.startsWith('/employee') && role !== 'employee') {
      const url = request.nextUrl.clone()
      url.pathname = '/hr'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

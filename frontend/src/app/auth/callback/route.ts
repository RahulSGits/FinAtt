import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // The 'next' param is used to redirect the user to a specific page after login
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has password_created = false
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
         const { data: profile } = await supabase
           .from('profiles')
           .select('password_created')
           .eq('id', user.id)
           .single()
           
         if (profile && profile.password_created === false) {
            return NextResponse.redirect(`${origin}/set-password`)
         }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Invalid+magic+link`)
}

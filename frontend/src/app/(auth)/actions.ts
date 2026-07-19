'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }
  
  if (authData.user) {
     const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, password_created')
      .eq('id', authData.user.id)
      .single()

     // Fallback to user_metadata if profile query fails (e.g. RLS issues)
     const role = profile?.role || authData.user.user_metadata?.role || 'employee'
     const passwordCreated = profile?.password_created ?? authData.user.user_metadata?.password_created ?? true

     if (profileError) {
       console.warn('Profile fetch failed during login, using metadata fallback:', profileError.message)
     }
      
     if (passwordCreated === false) {
       redirect('/set-password')
     }
      
     if (role === 'hr') {
        redirect('/hr')
     } else {
        redirect('/employee')
     }
  }
  
  return { error: 'Unknown error occurred' }
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
        role: formData.get('role') as string,
        phone: formData.get('phone') as string,
        department: formData.get('department') as string,
        designation: formData.get('designation') as string,
        account_status: 'active', // If self-registering, they are active
        password_created: true // Since they just provided a password
      }
    }
  }

  const { error, data: authData } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }
  
  if (authData.user) {
    redirect('/login')
  }
  
  return { error: 'Unknown error occurred' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function setupPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  // The user should already have a session via the invite link
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Update password in Auth
  const { error: authError } = await supabase.auth.updateUser({ password })
  if (authError) {
    return { error: authError.message }
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      password_created: true, 
      account_status: 'active' 
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  redirect('/employee')
}

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()
  // Ensure the caller is an HR
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'hr') return { error: 'Unauthorized' }

  // Use service role for admin tasks
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string
  const department = formData.get('department') as string
  const designation = formData.get('designation') as string
  const joiningDate = formData.get('joiningDate') as string
  const gender = formData.get('gender') as string
  const address = formData.get('address') as string
  const status = formData.get('status') as string || 'active'

  // Invite user securely
  const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: 'employee',
      phone: phone,
      department: department,
      designation: designation,
      account_status: 'pending',
      password_created: false
    }
  })

  if (inviteError) {
    return { error: inviteError.message }
  }

  // The database trigger creates the profile and the basic employee record.
  // We now update the employee record with the remaining fields using admin client
  if (authData.user) {
    await supabaseAdmin
      .from('employees')
      .update({
        joining_date: joiningDate || null,
        gender: gender || null,
        address: address || null,
        status: status,
        phone: phone || null
      })
      .eq('user_id', authData.user.id)
  }
  
  revalidatePath('/hr')
  return { success: true }
}

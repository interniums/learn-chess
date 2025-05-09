'use server'

import { createClient } from '@/supabase/server'

type Props = {
  email: string
  password: string
}

type CreateAccountResponse = {
  error: string | null
  success?: boolean
}

type LoginResponse = {
  error: string | null
}

type AnonymousLoginResponse = {
  success?: boolean
  error: string | null
}

export async function createAccountAction({ email, password }: Props): Promise<CreateAccountResponse> {
  if (!email || !password) {
    return { error: 'No data provided' }
  }

  const supabase = await createClient()

  try {
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // Ensure it's not a "not found" error
      return { error: 'Error while searching for dublicate email' }
    }

    if (existingUser) {
      return { error: 'Email already exists' }
    }

    // Create user session
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      return { error: 'Error while creating a user' }
    }

    if (!data.session || !data.user) {
      return { error: 'User or session wasn`t created' }
    }

    // Save user to the database
    const { data: user, error: saveUserError } = await supabase.from('users').insert([{ email }]).select()

    if (saveUserError) {
      return { error: 'Error while saving user into db' }
    }

    if (user) {
      return { error: null, success: true }
    }

    return { error: 'User wasn`t created' }
  } catch (error) {
    console.error(error)
    return { error: `Unexpected error, ${error}` }
  }
}

export async function loginAction({ email, password }: Props): Promise<LoginResponse> {
  if (!email || !password) {
    return { error: 'No data provided' }
  }

  const supabase = await createClient()

  try {
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (userCheckError) {
      return { error: 'Error while searching for user' }
    }

    if (!existingUser) {
      return { error: 'Email don`t exists' }
    }

    // Create user session
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      return { error: 'Error while login' }
    }

    if (!data.session || !data.user) {
      return { error: 'User or session wasn`t retrieved' }
    }

    return { error: null }
  } catch (error) {
    console.error(error)
    return { error: `Unexpected error, ${error}` }
  }
}

export async function anonymousLoginAction(): Promise<AnonymousLoginResponse> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInAnonymously()

    if (error) {
      return { error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error(error)
    return { error: `Unexpected error, ${error}` }
  }
}

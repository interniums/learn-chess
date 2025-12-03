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
  if (!email || !password) return { error: 'No data provided' }

  const supabase = await createClient()

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!data.user) return { error: 'User wasn`t created' }

  // If you require email confirmation, session may be null here — that's OK.
  const { error: saveUserError } = await supabase
    .from('users')
    .upsert({ id: data.user.id, email }, { onConflict: 'id' })

  if (saveUserError) {
    console.log('saveUserError', saveUserError)
    return { error: 'Error while saving user into db' }
  }

  return { error: null, success: true }
}

export async function loginAction({ email, password }: Props): Promise<LoginResponse> {
  if (!email || !password) return { error: 'No data provided' }

  const supabase = await createClient()

  const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
  if (loginError) return { error: loginError.message }
  if (!data.user) return { error: 'User wasn`t retrieved' }

  // optional: ensure profile exists
  await supabase.from('users').upsert({ id: data.user.id, email: data.user.email }, { onConflict: 'id' })

  return { error: null }
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

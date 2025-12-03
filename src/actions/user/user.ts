'use server'

import { createClient } from '@/supabase/server'

const DEFAULT_LESSON = '/first-principles/simple-mates'
export async function getLastVisitedLesson(): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return DEFAULT_LESSON
  }

  try {
    const { data, error } = await supabase.from('users').select('last_visited_lesson').eq('email', user.email).single()

    if (error) {
      return DEFAULT_LESSON
    }

    if (!data?.last_visited_lesson) {
      return DEFAULT_LESSON
    }

    return data.last_visited_lesson
  } catch (error) {
    console.error('Error fetching last visited lesson:', error)
    return DEFAULT_LESSON
  }
}

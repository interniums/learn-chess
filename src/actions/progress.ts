'use server'

import { createClient } from '@/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProgressAction(lessonId: string, currentStepIndex: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Use upsert to handle both insert and update
    const { error } = await supabase.from('user_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      last_position: currentStepIndex,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Progress save error:', err)
    return { error: 'Unexpected error occurred' }
  }
}

export async function completeLessonAction(lessonId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('user_progress')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)

  // Fallback if update failed (e.g. row didn't exist yet?)
  // Ideally we should upsert, but updateProgressAction handles creation usually.
  // Let's safe upsert just in case they jumped to complete.

  if (error) {
    // Try insert if update failed (likely row missing)
    const { error: insertError } = await supabase.from('user_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/')
  return { success: true }
}

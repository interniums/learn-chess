'use server'
import { WellcomePage } from '@/pages/wellcome/WellcomePage'
import { createClient } from '@/supabase/server'
import { getFirstLesson, getLastPlayedLesson } from '@/lib/api'

export default async function Wellcome() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  // 1. Try to get last played lesson for authenticated user
  let lessonToRedirect = null
  if (data.user) {
    lessonToRedirect = await getLastPlayedLesson()
  }

  // 2. If no last played (new user or anon without progress), get first lesson
  if (!lessonToRedirect) {
    lessonToRedirect = await getFirstLesson()
  }

  // 3. Construct path or fallback
  const redirectPath = lessonToRedirect
    ? `/${lessonToRedirect.sectionSlug}/${lessonToRedirect.lessonSlug}`
    : '/first-principles/simple-mates' // absolute fallback

  return <WellcomePage user={Boolean(data.user)} firstLessonPath={redirectPath} />
}

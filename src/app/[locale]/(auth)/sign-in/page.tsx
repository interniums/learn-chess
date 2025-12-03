'use server'

import { SignInPage } from '@/pages/(auth)/sign-in/SignInPage'
import { getFirstLesson } from '@/lib/api'

export default async function SignIn() {
  const firstLesson = await getFirstLesson()
  const firstLessonPath = firstLesson ? `/${firstLesson.sectionSlug}/${firstLesson.lessonSlug}` : '/wellcome'

  return <SignInPage firstLessonPath={firstLessonPath} />
}

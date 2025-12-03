'use server'

import { SignUpPage } from '@/pages/(auth)/sign-up/SignUpPage'
import { getFirstLesson } from '@/lib/api'

export default async function SignUp() {
  const firstLesson = await getFirstLesson()
  const firstLessonPath = firstLesson ? `/${firstLesson.sectionSlug}/${firstLesson.lessonSlug}` : '/wellcome'

  return <SignUpPage firstLessonPath={firstLessonPath} />
}

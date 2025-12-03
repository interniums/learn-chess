import { LessonPage } from '@/pages/lesson/LessonPage'
import { getLessonBySlug, getLessonContents, getUserProgress } from '@/lib/api'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{
    locale: string
    section: string
    lesson: string[]
  }>
}

export default async function Lesson({ params }: Props) {
  const { locale, section, lesson } = await params
  const lessonSlug = lesson[0]

  if (!lessonSlug) {
    notFound()
  }

  const lessonData = await getLessonBySlug(section, lessonSlug)

  if (!lessonData) {
    notFound()
  }

  // Fetch contents and progress in parallel
  const [contents, userProgress] = await Promise.all([getLessonContents(lessonData.id), getUserProgress(lessonData.id)])

  const formattedContents = contents.map((c) => ({
    id: c.id,
    type: c.type,
    content: c.content as Record<string, unknown>,
  }))

  const title = lessonData.title[locale] || lessonData.title['en'] || 'Lesson'

  // Determine initial index from saved progress
  // Default to 0 if no progress or complete reset
  const initialIndex = userProgress?.last_position || 0

  return (
    <LessonPage contents={formattedContents} lessonTitle={title} lessonId={lessonData.id} initialIndex={initialIndex} />
  )
}

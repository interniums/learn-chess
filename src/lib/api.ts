import { createClient } from '@/supabase/server'
import { cache } from 'react'

export type Lesson = {
  id: string
  title: Record<string, string>
  description: Record<string, string>
  slug: string
  order: number
}

export type LessonContent = {
  id: string
  type: 'text' | 'image' | 'exercise' | 'video'
  content: any
  order: number
}

export type UserProgress = {
  completed: boolean
  last_position: number
}

export const getLessonBySlug = cache(async (sectionSlug: string, lessonSlug: string) => {
  const supabase = await createClient()

  // First get section id
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('id')
    .eq('slug', sectionSlug)
    .single()

  if (sectionError || !section) return null

  // Get lesson
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('section_id', section.id)
    .eq('slug', lessonSlug)
    .single()

  if (lessonError || !lesson) return null

  return lesson
})

export const getLessonContents = cache(async (lessonId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lesson_contents')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order', { ascending: true })

  if (error) return []
  return data
})

export const getUserProgress = cache(async (lessonId: string) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  if (error) return null
  return data
})

export const getFirstLesson = cache(async () => {
  const supabase = await createClient()

  // Get the first book (assuming only one book for now or order by date)
  const { data: book } = await supabase.from('books').select('id').limit(1).single()
  if (!book) return null

  // Get first section
  const { data: section } = await supabase
    .from('sections')
    .select('id, slug')
    .eq('book_id', book.id)
    .order('order', { ascending: true })
    .limit(1)
    .single()
  if (!section) return null

  // Get first lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('slug')
    .eq('section_id', section.id)
    .order('order', { ascending: true })
    .limit(1)
    .single()
  if (!lesson) return null

  return {
    sectionSlug: section.slug,
    lessonSlug: lesson.slug,
  }
})

export const getLastPlayedLesson = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get the most recently updated progress entry
  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!progress) return null

  // Get lesson details to construct slug
  // Join lesson -> section -> book (if needed)
  const { data: lesson } = await supabase
    .from('lessons')
    .select('slug, section_id, sections(slug)')
    .eq('id', progress.lesson_id)
    .single()

  if (!lesson || !lesson.sections) return null

  // TypeScript hack because supabase types might not automatically infer deep joins correctly without generated types
  // @ts-ignore
  const sectionSlug = lesson.sections.slug

  return {
    sectionSlug: sectionSlug,
    lessonSlug: lesson.slug,
  }
})

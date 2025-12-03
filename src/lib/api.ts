import { createClient } from '@/supabase/server'
import { cache } from 'react'

// NOTE: This type is not strictly enforced against the database schema and is kept minimal
// to support both the old JSON-based lessons and the new relational schema.
export type Lesson = {
  id: string
  title: any
  slug: string
}

export type LessonContent = {
  id: string
  type: 'text' | 'image' | 'exercise' | 'video' | 'text_exercise'
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

  // 1) Fetch lesson sections (intro, subjects, fun facts, quiz text, etc.)
  const { data: sections, error: sectionsError } = await supabase
    .from('lesson_sections')
    .select('id, section_order, title, body_markdown, kind, image_url, image_alt')
    .eq('lesson_id', lessonId)
    .order('section_order', { ascending: true })

  if (sectionsError) {
    return []
  }

  // 2) Fetch exercises (main and harder / no-help)
  const { data: exercises, error: exercisesError } = await supabase
    .from('lesson_exercises')
    .select('id, exercise_order, type, prompt_markdown, difficulty, target, prerequisites, rules, checklist_markdown, common_mistake_markdown, no_help')
    .eq('lesson_id', lessonId)
    .order('exercise_order', { ascending: true })

  if (exercisesError) {
    // still return sections if exercises fail
    const sectionContentsFallback = (sections ?? []).flatMap((s: any) => {
      const items: any[] = []
      // Text step
      items.push({
        id: `section-${s.id}`,
        type: 'text' as const,
        content: { text: s.body_markdown },
        order: s.section_order,
      })
      // Optional image step
      if (s.image_url) {
        items.push({
          id: `section-image-${s.id}`,
          type: 'image' as const,
          content: { src: s.image_url, caption: s.image_alt || s.title },
          order: s.section_order + 0.1,
        })
      }
      return items
    })
    return sectionContentsFallback
  }

  // 3) Fetch positions and index by exercise_id
  const { data: positions } = await supabase
    .from('lesson_positions')
    .select('id, lesson_id, exercise_id, fen, side_to_move, correct_move, explanation')
    .eq('lesson_id', lessonId)

  const positionsByExerciseId = new Map<string, any>()
  ;(positions ?? []).forEach((p: any) => {
    if (p.exercise_id) {
      positionsByExerciseId.set(String(p.exercise_id), p)
    }
  })

  // Map sections (intro, subjects, fun facts, quiz text, etc.) to LessonViewer-compatible contents
  const sectionContents = (sections ?? []).flatMap((s: any) => {
    const items: any[] = []

    // 1) Main text block
    items.push({
      id: `section-${s.id}`,
      type: 'text' as const,
      content: { text: s.body_markdown },
      order: s.section_order,
    })

    // 2) Optional illustrative image after the section
    if (s.image_url) {
      items.push({
        id: `section-image-${s.id}`,
        type: 'image' as const,
        content: { src: s.image_url, caption: s.image_alt || s.title },
        order: s.section_order + 0.1,
      })
    }

    return items
  })

  // Map exercises + positions to chess exercises (goal-based)
  const exerciseContents = (exercises ?? []).map((e: any) => {
    const pos = positionsByExerciseId.get(String(e.id))

    // Basic default FEN / goal if position missing
    const initialFen = pos?.fen ?? '8/8/8/8/8/8/8/8 w - - 0 1'
    const sideToMove = pos?.side_to_move === 'black' ? 'b' : 'w'

    // Build the goal description from target + explanation if available
    const baseGoalDescription = e.target || 'Achieve the tactical/strategic goal in this position.'
    const extra = pos?.explanation ? ` ${pos.explanation}` : ''

    const goal = {
      goalType: 'mate', // current focus of simple-mates course; can be generalized later
      sideToMove,
      description: `${baseGoalDescription}${extra}`.trim(),
      rating: {
        idealMoves: 3,
        goodMoves: 5,
        maxMoves: 10,
      },
    }

    // Combine prerequisites, rules, checklist, and common mistakes into a rich instruction text.
    const parts: string[] = []
    if (e.prompt_markdown) parts.push(e.prompt_markdown)
    if (e.prerequisites) parts.push(`Prerequisites:\n${e.prerequisites}`)
    if (e.rules) parts.push(`Rules:\n${e.rules}`)
    if (e.checklist_markdown) parts.push(`Step-by-step checklist:\n${e.checklist_markdown}`)

    const instructions = parts.join('\n\n')

    // Use common mistake text as a hint if present
    const hint = e.common_mistake_markdown || pos?.explanation || null

    return {
      id: `exercise-${e.id}`,
      type: 'exercise' as const,
      content: {
        instructions,
        initialFen,
        hint: e.no_help ? null : hint,
        goal,
        demo: undefined,
      },
      // Put exercises after the main lesson text by default
      order: 1000 + e.exercise_order,
    }
  })

  // Combine and sort by synthetic order
  const combined = [...sectionContents, ...exerciseContents]
  combined.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return combined
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

  // Get first section (still ordered by section.order)
  const { data: section } = await supabase
    .from('sections')
    .select('id, slug')
    .eq('book_id', book.id)
    .order('order', { ascending: true })
    .limit(1)
    .single()
  if (!section) return null

  // Get first lesson within that section.
  // We no longer rely on a legacy lessons.order column; use slug ordering as a stable fallback.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('slug')
    .eq('section_id', section.id)
    .order('slug', { ascending: true })
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

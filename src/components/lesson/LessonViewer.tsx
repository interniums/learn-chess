'use client'

import { useState } from 'react'
import { ChessBoardComponent } from './ChessBoardComponent'
import Image from 'next/image'
import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ExerciseStep } from '@/types/chess'

type TextContent = {
  text: string
}

type ImageContent = {
  src: string
  caption?: string
}

type ExerciseContent = {
  instructions: string
  initialFen: string
  hint?: string
  moves: ExerciseStep[]
}

export type LessonContent = {
  id: string
  type: 'text' | 'image' | 'exercise'
  content: TextContent | ImageContent | ExerciseContent
}

type Props = {
  lessonId: string
  contents: LessonContent[]
  onComplete?: () => void
  initialIndex?: number
  onStepChange?: (index: number) => void
}

export const LessonViewer = ({ lessonId, contents, onComplete, initialIndex = 0, onStepChange }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const currentContent = contents[currentIndex]
  const isLast = currentIndex === contents.length - 1

  // Stable ID for exercise progress per lesson + step
  const exerciseIdForStep =
    currentContent.type === 'exercise' ? `lesson-${lessonId}-step-${currentIndex}` : undefined

  const handleNext = () => {
    if (isLast) {
      onComplete?.()
    } else {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      onStepChange?.(nextIndex)
    }
  }

  const handlePrev = () => {
    const prevIndex = Math.max(0, currentIndex - 1)
    setCurrentIndex(prevIndex)
    onStepChange?.(prevIndex)
  }

  const handleExerciseComplete = () => {
    // Save progress when exercise is completed
    onStepChange?.(currentIndex)
  }

  return (
    <div className="flex flex-col relative">
      <div className="flex-1 w-full max-w-2xl mx-auto p-4 pb-24">
        {/* pb-32 ensures content isn't hidden behind fixed footer */}

        <div className="flex flex-col justify-center items-center gap-8">
          {/* Content */}
          <div className="w-full">
            {currentContent.type === 'text' &&
              (() => {
                const text = (currentContent.content as TextContent).text ?? ''
                const paragraphs = text
                  .split(/\n\s*\n/) // paragraphs separated by blank lines
                  .map((p) => p.trim())
                  .filter(Boolean)

                return (
                  <div className="animate-in fade-in slide-in-from-bottom-4 px-4 pb-4 pt-2">
                    <div className="mx-auto w-full max-w-[42ch] text-[16px] leading-7 sm:text-base text-(--default-black)">
                      <div className="prose prose-zinc dark:prose-invert max-w-none">
                        {paragraphs.length > 0 ? (
                          paragraphs.map((p, idx) => (
                            <p key={idx} className="m-0 mb-3 whitespace-pre-line break-words text-left">
                              {p}
                            </p>
                          ))
                        ) : (
                          <p className="m-0 whitespace-pre-line break-words text-left">{text}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

            {currentContent.type === 'image' && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg animate-in fade-in zoom-in-95 border border-slate-200">
                <Image
                  src={(currentContent.content as ImageContent).src}
                  alt={(currentContent.content as ImageContent).caption || 'Lesson image'}
                  fill
                  className="object-cover"
                />
                {(currentContent.content as ImageContent).caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-center text-sm">
                    {(currentContent.content as ImageContent).caption}
                  </div>
                )}
              </div>
            )}

            {currentContent.type === 'exercise' && (
          <div className="w-full animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4 text-center text-(--default-black)">
              {(currentContent.content as ExerciseContent).instructions}
            </h3>
            <ChessBoardComponent
              key={exerciseIdForStep ?? currentContent.id} // Force re-mount on content change but keep storage key stable
              exerciseId={exerciseIdForStep ?? String(currentContent.id)}
              initialFen={(currentContent.content as ExerciseContent).initialFen}
              interactive={true}
              hint={(currentContent.content as ExerciseContent).hint}
              moves={(currentContent.content as ExerciseContent).moves}
              onComplete={handleExerciseComplete}
            />
          </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Gradient fade background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white/90 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative max-w-2xl mx-auto w-full px-4">
          {/* Progress Numbers */}
          <div className="pt-3">
            <div className="flex justify-end text-xs text-gray-500 font-medium">
              {currentIndex + 1} / {contents.length}
            </div>
          </div>

          {/* Buttons */}
          <div className="pb-3">
            <div className="w-full flex justify-center items-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="max-w-[140px] border-slate-300 text-(--default-black) hover:bg-slate-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="max-w-[140px] bg-(--brown-bg) text-white hover:bg-[#5e2900] shadow-md"
              >
                {isLast ? 'Complete' : 'Next'} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

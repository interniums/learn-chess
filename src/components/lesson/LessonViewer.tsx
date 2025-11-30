'use client'

import { useState } from 'react'
import { ChessBoardComponent } from './ChessBoardComponent'
import Image from 'next/image'
import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type LessonContent = {
  id: string
  type: 'text' | 'image' | 'exercise'
  content: Record<string, any>
}

type Props = {
  contents: LessonContent[]
  onComplete?: () => void
  initialIndex?: number
  onStepChange?: (index: number) => void
}

export const LessonViewer = ({ contents, onComplete, initialIndex = 0, onStepChange }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const currentContent = contents[currentIndex]
  const isLast = currentIndex === contents.length - 1

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] relative">
      {/* 
         min-h calculation accounts for the header height (approx 60px).
         We use relative positioning for the container.
      */}

      <div className="flex-1 w-full max-w-2xl mx-auto p-4 pb-32">
        {/* pb-32 ensures content isn't hidden behind fixed footer */}

        <div className="flex flex-col justify-center items-center gap-8 min-h-[50vh]">
          {/* Content */}
          <div className="w-full">
            {currentContent.type === 'text' && (
              <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 whitespace-pre-wrap text-(--default-black)">
                <p>{currentContent.content.text}</p>
              </div>
            )}

            {currentContent.type === 'image' && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg animate-in fade-in zoom-in-95 border border-slate-200">
                <Image
                  src={currentContent.content.src}
                  alt={currentContent.content.caption || 'Lesson image'}
                  fill
                  className="object-cover"
                />
                {currentContent.content.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-center text-sm">
                    {currentContent.content.caption}
                  </div>
                )}
              </div>
            )}

            {currentContent.type === 'exercise' && (
              <div className="w-full animate-in fade-in zoom-in-95">
                <h3 className="text-xl font-bold mb-4 text-center text-(--default-black)">
                  {currentContent.content.instructions}
                </h3>
                <ChessBoardComponent
                  key={currentContent.id} // Force re-mount on content change
                  exerciseId={currentContent.id}
                  initialFen={currentContent.content.initialFen}
                  interactive={true}
                  hint={currentContent.content.hint}
                  moves={currentContent.content.moves}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 shadow-[0_-1px_6px_rgba(0,0,0,0.06)]">
        {/* Progress Numbers - Semi-transparent */}
        <div className="max-w-2xl mx-auto w-full px-4 pt-3 bg-white/60 backdrop-blur-sm">
          <div className="flex justify-end text-xs text-gray-500 font-medium">
            {currentIndex + 1} / {contents.length}
          </div>
        </div>

        {/* Buttons - Solid background */}
        <div className="max-w-2xl mx-auto w-full px-4 pb-3 bg-white/95 backdrop-blur-xl">
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
  )
}

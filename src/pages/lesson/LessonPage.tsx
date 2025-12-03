'use client'

import { LessonViewer, LessonContent } from '@/components/lesson/LessonViewer'
import { completeLessonAction, updateProgressAction } from '@/actions/progress'
import { toast } from 'react-toastify'
import { useRouter } from '@/i18n/routing'
import { ChevronLeft } from 'lucide-react'

type Props = {
  contents: LessonContent[]
  lessonTitle: string
  lessonId: string
  initialIndex?: number
}

export const LessonPage = ({ contents, lessonTitle, lessonId, initialIndex = 0 }: Props) => {
  const router = useRouter()

  const handleStepChange = async (index: number) => {
    // Save progress quietly
    try {
      const result = await updateProgressAction(lessonId, index)
      if (result?.error) {
        toast.error(`Failed to save progress: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      toast.error('Error saving progress')
    }
  }

  const handleComplete = async () => {
    try {
      const { error } = await completeLessonAction(lessonId)
      if (error) {
        toast.error('Failed to save progress')
      } else {
        toast.success('Lesson Completed!')
        router.push('/wellcome')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="bg-background min-h-screen flex flex-col pt-[70px]">
      <header className="fixed top-0 left-0 right-0 z-50 px-3 py-3 border-b bg-white/80 backdrop-blur-md flex items-center shadow-sm">
        {/* Left: icon-only back button */}
        <div className="w-[40px] flex justify-start">
          <button
            onClick={() => router.push('/wellcome')}
            className="flex items-center justify-center w-8 h-8 rounded-full text-(--default-black) hover:bg-slate-100 hover:text-(--brown-bg) transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Center: lesson title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-base sm:text-lg font-bold text-(--default-black) truncate max-w-[80%] text-center">
            {lessonTitle}
          </h1>
        </div>

        {/* Right: spacer to balance layout */}
        <div className="w-[40px]" />
      </header>
      <LessonViewer
        lessonId={lessonId}
        contents={contents}
        onComplete={handleComplete}
        initialIndex={initialIndex}
        onStepChange={handleStepChange}
      />
    </div>
  )
}

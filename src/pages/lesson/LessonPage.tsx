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
    await updateProgressAction(lessonId, index)
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
    <div className="bg-background min-h-screen flex flex-col">
      <header className="p-4 border-b bg-white/80 backdrop-blur-md flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="text-sm flex items-center gap-1 text-(--default-black) hover:text-(--brown-bg) transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <h1 className="text-lg font-bold text-(--default-black) truncate max-w-[70%]">{lessonTitle}</h1>
        <div className="w-[60px]" /> {/* Spacer for centering */}
      </header>
      <LessonViewer
        contents={contents}
        onComplete={handleComplete}
        initialIndex={initialIndex}
        onStepChange={handleStepChange}
      />
    </div>
  )
}

/**
 * Visual feedback for move correctness
 */

import { Check, X } from 'lucide-react'
import type { MoveStatus } from '@/types/chess'

interface MoveFeedbackProps {
  status: MoveStatus
  isCompleted?: boolean
}

export const MoveFeedback = ({ status, isCompleted }: MoveFeedbackProps) => {
  if (isCompleted) {
    return (
      <div className="absolute inset-0 flex items-start justify-end p-4 z-20 pointer-events-none">
        <div className="bg-green-500 rounded-full p-4 shadow-2xl animate-in zoom-in duration-300">
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
      </div>
    )
  }

  if (!status) return null

  return (
    <div className="absolute inset-0 flex items-start justify-end p-4 pointer-events-none z-20">
      <div
        className={`rounded-full p-4 shadow-2xl animate-in zoom-in duration-300 ${
          status === 'correct' ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {status === 'correct' ? (
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        ) : (
          <X className="w-12 h-12 text-white" strokeWidth={3} />
        )}
      </div>
    </div>
  )
}

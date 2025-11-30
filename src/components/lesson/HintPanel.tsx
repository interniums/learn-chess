/**
 * Hint panel for showing move hints and descriptions
 */

import { Lightbulb, Eye } from 'lucide-react'

interface HintPanelProps {
  description?: string
  hint?: string
  showHint: boolean
  onToggleHint: () => void
  onRevealMove: () => void
  isMoveRevealed: boolean
  isCompleted: boolean
}

export const HintPanel = ({
  description,
  hint,
  showHint,
  onToggleHint,
  onRevealMove,
  isMoveRevealed,
  isCompleted,
}: HintPanelProps) => {
  if (!description) return null

  return (
    <div className="relative w-full bg-slate-50 rounded-lg p-4 shadow-sm h-[120px] flex items-center">
      {/* Hint & Reveal Buttons - Centered Right (always reserve space) */}
      <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col gap-2 z-10">
        {hint && !isCompleted && (
          <>
            {/* Show/Hide Hint Button */}
            <button
              onClick={onToggleHint}
              className={`p-2 rounded-full transition-all duration-200 ${
                showHint
                  ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={showHint ? 'Hide Hint' : 'Show Hint'}
            >
              <Lightbulb className={`w-4 h-4 ${showHint ? 'fill-current' : ''}`} />
            </button>

            {/* Reveal Move Button */}
            <button
              onClick={onRevealMove}
              className={`p-2 rounded-full transition-all duration-200 ${
                isMoveRevealed
                  ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={isMoveRevealed ? 'Hide Move' : 'Reveal Move'}
            >
              <Eye className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Description/Hint Text */}
      <div className={hint ? 'pr-10' : ''}>
        {showHint && hint && !isCompleted ? (
          <div className="text-yellow-800 text-sm leading-relaxed">
            <p className="font-semibold mb-2">💡 Hint:</p>
            <p>{hint}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  )
}

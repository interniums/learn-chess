/**
 * Control buttons for chess exercises
 */

import { RotateCcw, Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExerciseControlsProps {
  onRestart: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export const ExerciseControls = ({ onRestart, onUndo, onRedo, canUndo, canRedo }: ExerciseControlsProps) => {
  return (
    <div className="flex gap-2 justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onRestart}
        className="border-slate-300 hover:bg-slate-100"
        title="Restart Exercise"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="border-slate-300 hover:bg-slate-100 disabled:opacity-50"
        title="Undo Last Move"
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="border-slate-300 hover:bg-slate-100 disabled:opacity-50"
        title="Redo Next Move"
      >
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  )
}

'use client'

import { Chess } from 'chess.js'
import { useEffect, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { Lightbulb, RotateCcw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'

// -- Types matching Database JSON Structure --
export type MoveStep = {
  id: number
  correctMove: string
  description: string
  acceptedMoves?: string[]
  computerMove?: string | null
}

type Props = {
  initialFen: string
  moves: MoveStep[]
  hint: string
  interactive?: boolean
  onComplete?: () => void
}

export const ChessBoardComponent = ({ initialFen, moves, hint, interactive = true, onComplete }: Props) => {
  // 1. Determine starting position. Default to standard start if missing.
  const startPosition = initialFen

  // 2. Game State
  // We use a key on the component to force full reset if initialFen changes
  const [game, setGame] = useState(new Chess(startPosition))
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)

  // 3. Reset Effect: When prop `initialFen` changes, reset everything.
  useEffect(() => {
    try {
      const newGame = new Chess(startPosition)
      setGame(newGame)
      setCurrentStepIndex(0)
      setIsCompleted(false)
      setWrongAttempts(0)
      setShowHint(false)
    } catch (error) {
      console.error('Invalid initialFen:', startPosition, error)
      // Fallback to empty or start if error
      setGame(new Chess())
    }
  }, [startPosition])

  // 4. Move Logic
  function onDrop(sourceSquare: string, targetSquare: string) {
    if (isCompleted || !interactive) return false

    // A. Validate move in Chess engine (is it legal?)
    const gameCopy = new Chess(game.fen())
    let move = null
    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      })
    } catch (error) {
      console.error('Move failed:', error)
      return false // Illegal move
    }

    if (!move) return false // Illegal move

    // B. Check against Exercise Script
    // If we have no scripted moves, allow free play (fallback)
    if (!moves || moves.length === 0) {
      setGame(gameCopy)
      return true
    }

    const currentStep = moves[currentStepIndex]
    if (!currentStep) return false

    // Check if user move matches expected correct move(s)
    const userMoveSan = move.san
    const isCorrect = userMoveSan === currentStep.correctMove || currentStep.acceptedMoves?.includes(userMoveSan)

    if (isCorrect) {
      // 1. Update Board (User Move)
      setGame(gameCopy)
      toast.success('Good move!', { autoClose: 500, hideProgressBar: true })

      // 2. Handle Computer Response (if any)
      if (currentStep.computerMove) {
        setTimeout(() => {
          const computerGameCopy = new Chess(gameCopy.fen())
          try {
            const result = computerGameCopy.move(currentStep.computerMove!)
            if (result) {
              setGame(computerGameCopy)
            }
          } catch (error) {
            console.error('Computer move failed:', error)
          }
        }, 500)
      }

      // 3. Advance Step
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)

      // 4. Check Completion
      if (nextIndex >= moves.length) {
        setIsCompleted(true)
        toast.success('Exercise Completed!', { autoClose: 2000 })
        if (onComplete) onComplete()
      }

      return true
    } else {
      // Incorrect Move
      setWrongAttempts((prev) => prev + 1)
      toast.error('Incorrect move. Try again.')
      return false // Snap piece back
    }
  }

  // 5. Reset Handler
  const handleReset = () => {
    try {
      setGame(new Chess(startPosition))
      setCurrentStepIndex(0)
      setIsCompleted(false)
      setWrongAttempts(0)
      setShowHint(false)
    } catch (e) {
      console.error('Reset failed', e)
    }
  }

  // 6. Determine Current Description
  // If completed, show the description of the LAST step (often the mate/conclusion).
  // Otherwise show description for the NEXT move the user needs to make.
  const currentStepData = isCompleted ? moves[moves.length - 1] : moves[currentStepIndex]

  const descriptionText = currentStepData?.description || ''

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[500px] mx-auto">
      {/* Dynamic Description Area */}
      <div className="min-h-[80px] w-full bg-slate-50 p-4 rounded-md border border-slate-100 text-center flex flex-col justify-center">
        {descriptionText ? (
          descriptionText.split('\\n').map((line, i) => (
            <p key={i} className="text-(--default-black) text-sm mb-1 last:mb-0 leading-relaxed animate-in fade-in">
              {line}
            </p>
          ))
        ) : (
          <p className="text-gray-400 italic text-sm">Make your move...</p>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex justify-between w-full text-sm font-medium text-gray-600 px-1">
        <div>
          {isCompleted ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Completed
            </span>
          ) : (
            <span>
              Move {currentStepIndex + 1} / {moves.length}
            </span>
          )}
        </div>
        <div>Mistakes: {wrongAttempts}</div>
      </div>

      {/* Chess Board */}
      <div className="relative w-full aspect-square shadow-xl rounded-sm overflow-hidden border-4 border-[#4b4b4b] bg-[#F0D9B5]">
        <Chessboard
          key={startPosition}
          options={{
            position: game.fen().split(' ')[0],
            onPieceDrop: onDrop,
            allowDragging: interactive && !isCompleted,
            darkSquareStyle: { backgroundColor: '#B58863' },
            lightSquareStyle: { backgroundColor: '#F0D9B5' },
            animationDurationInMs: 300,
          }}
        />

        {/* Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 z-10 bg-black/10 flex items-center justify-center backdrop-blur-[1px] animate-in fade-in">
            <div className="bg-white p-6 rounded-full shadow-2xl transform scale-110">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex-1 border-slate-300 hover:bg-slate-100 text-slate-700"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Restart
        </Button>

        {hint && !isCompleted && (
          <Button
            variant={showHint ? 'secondary' : 'outline'}
            onClick={() => setShowHint(!showHint)}
            className={`flex-1 border-slate-300 ${
              showHint ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Lightbulb className={`w-4 h-4 mr-2 ${showHint ? 'fill-current' : ''}`} />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Button>
        )}
      </div>

      {/* Hint Box */}
      {showHint && hint && (
        <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm animate-in slide-in-from-top-2">
          <strong>Hint:</strong> {hint}
        </div>
      )}
    </div>
  )
}

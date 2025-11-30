'use client'

import { Chess } from 'chess.js'
import { useCallback, useEffect, useState, useRef } from 'react'
import { Chessboard, PieceDropHandlerArgs } from 'react-chessboard'
import { Lightbulb, RotateCcw, CheckCircle, Check, X, Undo2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBoardSettings } from '@/contexts/BoardSettingsContext'
import { BoardSettingsPanel } from './BoardSettingsPanel'
import confetti from 'canvas-confetti'

// -- Sound Effects (Lichess sounds) --
const playSound = (type: 'move' | 'capture' | 'check' | 'checkmate') => {
  let soundFile = '/sounds/Move.mp3'

  if (type === 'capture') {
    soundFile = '/sounds/Capture.mp3'
  } else if (type === 'check' || type === 'checkmate') {
    soundFile = '/sounds/GenericNotify.mp3'
  }

  const audio = new Audio(soundFile)
  audio.volume = 0.5
  audio.play().catch((error) => {
    console.error('Error playing sound:', error)
  })
}

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
  exerciseId?: string // Unique identifier for saving progress
}

export const ChessBoardComponent = ({ initialFen, moves, hint, interactive = true, onComplete, exerciseId }: Props) => {
  // 1. Determine starting position
  const startPosition = initialFen
  const { settings } = useBoardSettings()

  // 2. Game State - Initialize with default values for SSR
  const [game, setGame] = useState(() => new Chess(startPosition))
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [moveStatus, setMoveStatus] = useState<'correct' | 'incorrect' | null>(null)
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({})
  const [moveHistory, setMoveHistory] = useState<string[]>([startPosition])
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [premove, setPremove] = useState<{ from: string; to: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showMoveArrow, setShowMoveArrow] = useState(false)

  // 3. Load saved progress on client side only (after mount)
  useEffect(() => {
    if (!exerciseId || typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(`exercise_progress_${exerciseId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        const stepIndex = parsed.stepIndex || 0
        const history = parsed.history || [startPosition]
        const completed = parsed.completed || false

        // Only restore if there's actual progress
        if (stepIndex > 0 || completed) {
          const lastFen = history[history.length - 1]
          setGame(new Chess(lastFen))
          setCurrentStepIndex(stepIndex)
          setMoveHistory(history)
          setIsCompleted(completed)
        }
      }
    } catch (error) {
      console.error('Failed to load exercise progress:', error)
    }
  }, [exerciseId, startPosition])

  // 4. Reset Effect: When prop `initialFen` changes to a different value, reset everything.
  const previousFen = useRef(startPosition)
  useEffect(() => {
    // Only reset if the FEN actually changed (not on initial mount)
    if (previousFen.current === startPosition) {
      previousFen.current = startPosition
      return
    }

    previousFen.current = startPosition

    try {
      const newGame = new Chess(startPosition)
      setGame(newGame)
      setCurrentStepIndex(0)
      setIsCompleted(false)
      setShowHint(false)
      setMoveStatus(null)
      setHighlightSquares({})
      setMoveHistory([startPosition])
      setSelectedSquare(null)
      setPremove(null)
      setIsDragging(false)
      setShowMoveArrow(false)
    } catch (error) {
      console.error('Invalid initialFen:', startPosition, error)
      setGame(new Chess())
    }
  }, [startPosition])

  // 5. Save progress effect
  useEffect(() => {
    if (!exerciseId) return

    const progressData = {
      stepIndex: currentStepIndex,
      history: moveHistory,
      completed: isCompleted,
    }

    try {
      localStorage.setItem(`exercise_progress_${exerciseId}`, JSON.stringify(progressData))
    } catch (error) {
      console.error('Failed to save exercise progress:', error)
    }
  }, [currentStepIndex, moveHistory, isCompleted, exerciseId])

  // 6. Move Logic (shared between drag and click)
  const makeMove = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      // Guard: Check if completed or not interactive
      if (isCompleted || !interactive) return false

      // A. Validate move in Chess engine (is it legal?)
      const gameCopy = new Chess(game.fen())
      let move = null
      try {
        // Logic for promotion check:
        // @ts-expect-error - chess.js type definition issue
        const pieceObject = game.get(sourceSquare)
        const isPromotion =
          pieceObject?.type === 'p' &&
          ((pieceObject.color === 'w' && targetSquare[1] === '8') ||
            (pieceObject.color === 'b' && targetSquare[1] === '1'))

        move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? 'q' : undefined,
        })
      } catch {
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
        setMoveStatus('correct')
        setMoveHistory((prev) => [...prev, gameCopy.fen()])
        setSelectedSquare(null)

        // Highlight user's move (yellow, same as computer)
        const userHighlights = {
          [sourceSquare]: { backgroundColor: 'rgba(254, 240, 138, 0.6)' },
          [targetSquare]: { backgroundColor: 'rgba(254, 240, 138, 0.8)' },
        }
        setHighlightSquares(userHighlights)
        setShowMoveArrow(false) // Hide arrow after move is made

        // Play sound based on game state
        if (settings.playSounds) {
          if (gameCopy.isCheckmate()) {
            playSound('checkmate')
          } else if (gameCopy.isCheck()) {
            playSound('check')
          } else if (move.captured) {
            playSound('capture')
          } else {
            playSound('move')
          }
        }

        // Store premove (don't clear it yet - it will execute after computer move)
        const savedPremove = premove
        console.log('Correct move made, current premove:', premove)

        // Clear status after animation
        setTimeout(() => setMoveStatus(null), 800)

        // 2. Handle Computer Response (if any)
        if (currentStep.computerMove) {
          setTimeout(() => {
            const computerGameCopy = new Chess(gameCopy.fen())
            try {
              const result = computerGameCopy.move(currentStep.computerMove!)
              if (result) {
                // Highlight only computer move (replaces user highlight)
                const computerHighlights = {
                  [result.from]: { backgroundColor: 'rgba(254, 240, 138, 0.6)' },
                  [result.to]: { backgroundColor: 'rgba(254, 240, 138, 0.8)' },
                }
                setHighlightSquares(computerHighlights)
                setGame(computerGameCopy)
                setMoveHistory((prev) => [...prev, computerGameCopy.fen()])

                // Play sound based on game state after computer move
                if (settings.playSounds) {
                  if (computerGameCopy.isCheckmate()) {
                    playSound('checkmate')
                  } else if (computerGameCopy.isCheck()) {
                    playSound('check')
                  } else if (result.captured) {
                    playSound('capture')
                  } else {
                    playSound('move')
                  }
                }

                // Execute premove after delay if one was set
                setTimeout(() => {
                  console.log('Attempting to execute premove:', savedPremove)
                  if (savedPremove) {
                    const result = makeMove(savedPremove.from, savedPremove.to)
                    console.log('Premove execution result:', result)
                    // Clear premove after execution
                    setPremove(null)
                  }
                }, 1500)
              }
            } catch (error) {
              console.error('Computer move failed:', error)
            }
          }, 800)
        }

        // 3. Advance Step
        const nextIndex = currentStepIndex + 1
        setCurrentStepIndex(nextIndex)

        // 4. Check Completion
        if (nextIndex >= moves.length) {
          setIsCompleted(true)

          // Trigger confetti if enabled
          if (settings.showConfetti) {
            setTimeout(() => {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b4513', '#d2691e', '#f4a460', '#deb887'],
              })
            }, 300)
          }

          if (onComplete) onComplete()
        }

        return true
      } else {
        // Incorrect Move
        setMoveStatus('incorrect')
        setSelectedSquare(null)
        setHighlightSquares({}) // Clear all highlights including dots

        // Clear status after animation
        setTimeout(() => setMoveStatus(null), 800)

        return false // Snap piece back
      }
    },
    [
      isCompleted,
      interactive,
      game,
      moves,
      currentStepIndex,
      onComplete,
      premove,
      settings.showConfetti,
      settings.playSounds,
    ]
  )

  // 7. Drag and Drop Handler
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      // Guard: Ensure targetSquare is valid
      if (!targetSquare) return false
      setIsDragging(true)
      const result = makeMove(sourceSquare, targetSquare)
      // Reset dragging flag after a short delay to prevent click handler from triggering
      setTimeout(() => setIsDragging(false), 100)
      return result
    },
    [makeMove]
  )

  // 8. Click Handler for Click-to-Move
  const onSquareClick = useCallback(
    ({ square }: { square: string }) => {
      // Ignore clicks that happen right after dragging
      if (isDragging || isCompleted || !interactive) return

      // @ts-expect-error - chess.js type definition issue
      const piece = game.get(square)

      // If no square selected yet
      if (!selectedSquare) {
        // Only select if there's a piece on the square
        if (piece) {
          setSelectedSquare(square)

          // Calculate legal moves and highlight them
          if (settings.showLegalMoves) {
            // @ts-expect-error - chess.js type definition issue
            const moves = game.moves({ square, verbose: true })
            const moveHighlights: Record<string, React.CSSProperties> = {
              [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
            }

            // Add dots/circles for legal moves
            moves.forEach((move: { to: string; captured?: string }) => {
              const targetSquare = move.to
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const targetPiece = game.get(targetSquare as any)

              if (targetPiece) {
                // Capture move - show ring around piece
                moveHighlights[targetSquare] = {
                  background:
                    'radial-gradient(circle, transparent 65%, rgba(0, 0, 0, 0.3) 65%, rgba(0, 0, 0, 0.3) 80%, transparent 80%)',
                }
              } else {
                // Normal move - show dot
                moveHighlights[targetSquare] = {
                  background: 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 25%, transparent 25%)',
                }
              }
            })

            setHighlightSquares(moveHighlights)
          } else {
            // Just highlight selected square
            setHighlightSquares({
              [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
            })
          }
        }
        return
      }

      // If clicking the same square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null)
        setHighlightSquares({})
        return
      }

      // Try to make the move
      const success = makeMove(selectedSquare, square)

      // If move failed and clicked on another piece, select it instead
      if (!success && piece) {
        setSelectedSquare(square)

        // Calculate legal moves for new piece
        if (settings.showLegalMoves) {
          // @ts-expect-error - chess.js type definition issue
          const moves = game.moves({ square, verbose: true })
          const moveHighlights: Record<string, React.CSSProperties> = {
            [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          }

          moves.forEach((move: { to: string; captured?: string }) => {
            const targetSquare = move.to
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const targetPiece = game.get(targetSquare as any)

            if (targetPiece) {
              moveHighlights[targetSquare] = {
                background:
                  'radial-gradient(circle, transparent 65%, rgba(0, 0, 0, 0.3) 65%, rgba(0, 0, 0, 0.3) 80%, transparent 80%)',
              }
            } else {
              moveHighlights[targetSquare] = {
                background: 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 25%, transparent 25%)',
              }
            }
          })

          setHighlightSquares(moveHighlights)
        } else {
          setHighlightSquares({
            [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          })
        }
      } else {
        setSelectedSquare(null)
        if (!success) {
          setHighlightSquares({})
        }
      }
    },
    [isCompleted, interactive, game, selectedSquare, makeMove, isDragging, settings.showLegalMoves]
  )

  // 9. Right Click for Premove
  const onSquareRightClick = useCallback(
    ({ square }: { square: string }) => {
      console.log('Right click on square:', square, 'Settings:', {
        isCompleted,
        interactive,
        allowPremove: settings.allowPremove,
      })

      if (isCompleted || !interactive || !settings.allowPremove) {
        console.log('Right click blocked')
        return
      }

      // If no square selected, select for premove
      if (!selectedSquare) {
        // @ts-expect-error - chess.js type definition issue
        const piece = game.get(square)
        console.log('No square selected, piece on square:', piece)
        if (piece) {
          setSelectedSquare(square)
          setHighlightSquares({
            [square]: { backgroundColor: 'rgba(100, 149, 237, 0.4)' }, // Blue for premove
          })
          console.log('Selected square for premove:', square)
        }
        return
      }

      // Set premove
      const premoveData = { from: selectedSquare, to: square }
      console.log('Setting premove:', premoveData)
      setPremove(premoveData)
      setHighlightSquares({
        [selectedSquare]: { backgroundColor: 'rgba(100, 149, 237, 0.4)' },
        [square]: { backgroundColor: 'rgba(100, 149, 237, 0.6)' },
      })
      setSelectedSquare(null)
    },
    [isCompleted, interactive, game, selectedSquare, settings.allowPremove]
  )

  // 10. Reset Handler
  const handleReset = useCallback(() => {
    try {
      setGame(new Chess(startPosition))
      setCurrentStepIndex(0)
      setIsCompleted(false)
      setShowHint(false)
      setMoveStatus(null)
      setHighlightSquares({})
      setMoveHistory([startPosition])
      setSelectedSquare(null)
      setPremove(null)
      setIsDragging(false)
    } catch (e) {
      console.error('Reset failed', e)
    }
  }, [startPosition])

  // 11. Undo Handler
  const handleUndo = useCallback(() => {
    if (moveHistory.length <= 1 || currentStepIndex === 0) return

    // Remove last 2 positions (user move + computer move, or just user move)
    const currentStep = moves[currentStepIndex - 1]
    const stepsToRemove = currentStep?.computerMove ? 2 : 1

    const newHistory = moveHistory.slice(0, -stepsToRemove)
    const previousFen = newHistory[newHistory.length - 1]

    setMoveHistory(newHistory)
    setGame(new Chess(previousFen))
    setCurrentStepIndex((prev: number) => prev - 1)
    setHighlightSquares({})
    setMoveStatus(null)
    setSelectedSquare(null)
    setPremove(null)
    setIsCompleted(false) // Remove completed state when going back
  }, [moveHistory, currentStepIndex, moves])

  // 12. Determine Current Description
  const currentStepData = isCompleted ? moves[moves.length - 1] : moves[currentStepIndex]
  const descriptionText = currentStepData?.description || ''

  // 13. Calculate progress percentage
  const progressPercentage = moves.length > 0 ? (currentStepIndex / moves.length) * 100 : 0

  // 14. Helper function to get check/checkmate highlights
  const getCheckHighlights = (gameState: Chess) => {
    const highlights: Record<string, React.CSSProperties> = {}

    if (gameState.isCheckmate()) {
      // Find the king in checkmate
      const turn = gameState.turn()
      const board = gameState.board()
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = board[i][j]
          if (piece && piece.type === 'k' && piece.color === turn) {
            const file = String.fromCharCode(97 + j)
            const rank = String(8 - i)
            const square = file + rank
            highlights[square] = { backgroundColor: 'rgba(220, 38, 38, 0.8)' } // Red for checkmate
          }
        }
      }
    } else if (gameState.isCheck()) {
      // Find the king in check
      const turn = gameState.turn()
      const board = gameState.board()
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = board[i][j]
          if (piece && piece.type === 'k' && piece.color === turn) {
            const file = String.fromCharCode(97 + j)
            const rank = String(8 - i)
            const square = file + rank
            highlights[square] = { backgroundColor: 'rgba(239, 68, 68, 0.6)' } // Lighter red for check
          }
        }
      }
    }

    return highlights
  }

  // 15. Helper function to convert square notation to coordinates (0-7)
  const squareToCoords = (square: string) => {
    const file = square.charCodeAt(0) - 97 // 'a' = 0, 'b' = 1, etc.
    const rank = 8 - parseInt(square[1]) // '8' = 0, '7' = 1, etc.
    return { x: file, y: rank }
  }

  // 16. Get arrow coordinates for the correct move
  const getArrowCoords = () => {
    if (!currentStepData?.correctMove) return null

    // Create a temporary game to get the move details
    const tempGame = new Chess(game.fen())
    try {
      const moveResult = tempGame.move(currentStepData.correctMove)
      if (!moveResult) return null

      const fromCoords = squareToCoords(moveResult.from)
      const toCoords = squareToCoords(moveResult.to)

      // Convert to percentage positions (each square is 12.5% of board)
      return {
        x1: (fromCoords.x + 0.5) * 12.5,
        y1: (fromCoords.y + 0.5) * 12.5,
        x2: (toCoords.x + 0.5) * 12.5,
        y2: (toCoords.y + 0.5) * 12.5,
      }
    } catch {
      // Move is not valid for current position, silently return null
      return null
    }
  }

  const arrowCoords = showMoveArrow ? getArrowCoords() : null

  // 17. Combine all highlights (move highlights + check/checkmate highlights)
  const checkHighlights = getCheckHighlights(game)
  const combinedHighlights = { ...highlightSquares, ...checkHighlights }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[500px] mx-auto">
      {/* Move Title - Always reserve space */}
      <div className="w-full text-center h-[20px]">
        {moves.length > 0 && (
          <h3 className="text-sm font-semibold text-(--brown-bg)">
            Move {isCompleted ? moves.length : currentStepIndex + 1}
          </h3>
        )}
      </div>

      {/* Dynamic Description Area */}
      <div className="w-full bg-slate-50 p-4 rounded-md border border-slate-100 text-center flex flex-col justify-center relative shadow-sm h-[120px]">
        {/* Hint & Reveal Buttons - Centered Right */}
        {hint && !isCompleted && (
          <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col gap-2 z-10">
            <button
              onClick={() => {
                setShowHint(!showHint)
                if (showHint) setShowMoveArrow(false) // Hide arrow when closing hint
              }}
              className={`p-2 rounded-full transition-all duration-200 ${
                showHint
                  ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={showHint ? 'Hide Hint' : 'Show Hint'}
            >
              <Lightbulb className={`w-4 h-4 ${showHint ? 'fill-current' : ''}`} />
            </button>

            {currentStepData && (
              <button
                onClick={() => setShowMoveArrow(!showMoveArrow)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  showMoveArrow
                    ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
                title={showMoveArrow ? 'Hide Move' : 'Reveal Move'}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Description Text */}
        <div className={hint && !isCompleted ? 'pr-10' : ''}>
          {showHint ? (
            <div className="text-yellow-800 text-sm leading-relaxed">
              <p className="font-semibold mb-2">💡 Hint:</p>
              <p>{hint}</p>
            </div>
          ) : descriptionText ? (
            descriptionText.split('\\n').map((line, i) => (
              <p key={i} className="text-(--default-black) text-sm mb-1 last:mb-0 leading-relaxed">
                {line}
              </p>
            ))
          ) : (
            <p className="text-gray-400 italic text-sm">Make your move...</p>
          )}
        </div>
      </div>

      {/* Status Bar - Fixed height to prevent layout shift */}
      <div className="flex justify-between w-full text-sm font-medium text-gray-600 px-1 h-[24px]">
        <div>
          {isCompleted && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Completed
            </span>
          )}
        </div>
      </div>

      {/* Chess Board */}
      <div
        className="relative w-full aspect-square shadow-xl rounded-sm overflow-hidden bg-[#F0D9B5] [&_img]:scale-110"
        onContextMenu={(e) => {
          e.preventDefault()
          console.log('Context menu triggered on board container')
        }}
      >
        <Chessboard
          key={startPosition}
          options={{
            position: game.fen(),
            onPieceDrop,
            onSquareClick,
            onSquareRightClick,
            allowDragging: interactive && !isCompleted,
            animationDurationInMs: settings.pieceSpeed,
            squareStyles: combinedHighlights,
            dropSquareStyle: { boxShadow: 'none' },
          }}
        />

        {/* Move Status Overlay - Animated Checkmark/X */}
        {moveStatus && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div
              className={`animate-in zoom-in-50 fade-in duration-300 ${
                moveStatus === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'
              } rounded-full p-4 shadow-2xl`}
            >
              {moveStatus === 'correct' ? (
                <Check className="w-12 h-12 text-white stroke-[3]" />
              ) : (
                <X className="w-12 h-12 text-white stroke-[3]" />
              )}
            </div>
          </div>
        )}

        {/* Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 z-10 bg-black/10 flex items-center justify-center backdrop-blur-[1px] animate-in fade-in">
            <div className="bg-green-500/90 rounded-full p-4 shadow-2xl">
              <Check className="w-12 h-12 text-white stroke-[3]" />
            </div>
          </div>
        )}

        {/* Move Arrow Overlay */}
        {arrowCoords && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-15 animate-in fade-in duration-300"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="3"
                markerHeight="5"
                refX="2.5"
                refY="2.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon points="0 0, 3 2.5, 0 5" fill="#8b4513" />
              </marker>
            </defs>
            <line
              x1={`${arrowCoords.x1}%`}
              y1={`${arrowCoords.y1}%`}
              x2={`${arrowCoords.x2}%`}
              y2={`${arrowCoords.y2}%`}
              stroke="#8b4513"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              strokeLinecap="butt"
              className="drop-shadow-lg"
            />
          </svg>
        )}
      </div>

      {/* Progress Bar - Below Board */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-end text-xs text-gray-500 font-medium">
          {currentStepIndex} / {moves.length}
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden bg-transparent">
          <div
            className="h-full bg-(--brown-bg) rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full items-start">
        <Button
          variant="outline"
          onClick={handleReset}
          className="border-slate-300 hover:bg-slate-100 text-slate-700 p-2"
          title="Restart"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          onClick={handleUndo}
          disabled={currentStepIndex === 0}
          className="border-slate-300 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
          title="Back"
        >
          <Undo2 className="w-5 h-5" />
        </Button>

        <BoardSettingsPanel />
      </div>
    </div>
  )
}

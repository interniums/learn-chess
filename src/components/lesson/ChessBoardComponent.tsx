/**
 * Refactored Chess Board Component
 * Clean, maintainable, and performant implementation
 */

'use client'

import { useCallback, useMemo, memo, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { PieceDropHandlerArgs, PieceHandlerArgs } from 'react-chessboard'
import confetti from 'canvas-confetti'

// Hooks
import { useChessGame } from '@/hooks/useChessGame'
import { useBoardInteraction } from '@/hooks/useBoardInteraction'
import { useBoardSettings } from '@/contexts/BoardSettingsContext'

// Utils
import { playSound } from '@/utils/sounds'
import { getCheckHighlights, getArrowCoords, getLegalMovesForSquare, createLegalMoveHighlights } from '@/utils/chess'
import type { SquareStyles } from '@/utils/chess'

// Components
import { MoveFeedback } from './MoveFeedback'
import { HintArrow } from './HintArrow'
import { HintPanel } from './HintPanel'
import { ExerciseControls } from './ExerciseControls'
import { BoardSettingsPanel } from './BoardSettingsPanel'

// Types
import type { ExerciseStep } from '@/types/chess'

interface ChessBoardComponentProps {
  initialFen: string
  moves: ExerciseStep[]
  hint?: string
  interactive?: boolean
  onComplete?: () => void
  exerciseId: string
}

export const ChessBoardComponent = memo(
  ({ initialFen, moves, hint, interactive = true, onComplete, exerciseId }: ChessBoardComponentProps) => {
    const { settings } = useBoardSettings()

    // Game state management
    const {
      game,
      setGame,
      currentStepIndex,
      setCurrentStepIndex,
      moveHistory,
      setMoveHistory,
      fullHistory,
      setFullHistory,
      isCompleted,
      wasEverCompleted,
      isViewMode,
      moveStatus,
      setMoveStatus,
      resetGame,
      undoMove,
      redoMove,
      completeExercise,
    } = useChessGame({
      exerciseId,
      startPosition: initialFen,
      moves,
      onComplete,
    })

    // Board interaction state
    const {
      selectedSquare,
      highlightSquares,
      setHighlightSquares,
      isDragging,
      setIsDragging,
      showMoveArrow,
      setShowMoveArrow,
      clearSelection,
      selectSquare,
      highlightMove,
    } = useBoardInteraction(game, settings.showLegalMoves)

    // Wrapper for reset
    const handleReset = useCallback(() => {
      resetGame()
      clearSelection()
    }, [resetGame, clearSelection])

    // Wrapper for undo
    const handleUndo = useCallback(() => {
      undoMove()
      clearSelection() // Clear legal move highlights
    }, [undoMove, clearSelection])

    // Wrapper for redo
    const handleRedo = useCallback(() => {
      redoMove()
      clearSelection() // Clear legal move highlights
    }, [redoMove, clearSelection])

    // Hint state
    const [showHint, setShowHint] = useState(false)

    // Current step (with fallback to last step if index is beyond array)
    const currentStep = moves[currentStepIndex] || moves[moves.length - 1]
    const displayStepIndex = Math.min(currentStepIndex, moves.length - 1)

    // Progress calculation
    const progressPercentage = moves.length > 0 ? ((displayStepIndex + 1) / moves.length) * 100 : 0

    /**
     * Handle move execution
     */
    const makeMove = useCallback(
      (sourceSquare: string, targetSquare: string): boolean => {
        if (isCompleted || !interactive || isViewMode) return false

        const gameCopy = new Chess(game.fen())
        // @ts-expect-error - chess.js types are strict, but our strings are valid squares
        const piece = gameCopy.get(sourceSquare)

        if (!piece) return false

        // Attempt move with error handling
        let move
        try {
          const isPromotion = piece.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')
          move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            ...(isPromotion && { promotion: 'q' }),
          })
        } catch {
          // Invalid move, return false
          return false
        }

        if (!move) return false

        // Check if move is correct
        const isCorrect = move.san === currentStep?.correctMove || currentStep?.acceptedMoves?.includes(move.san)

        if (isCorrect) {
          // Update game state
          setGame(gameCopy)
          setMoveStatus('correct')
          const newFen = gameCopy.fen()
          setMoveHistory((prev) => [...prev, newFen])
          setFullHistory((prev) => [...prev, newFen])
          clearSelection()
          highlightMove(sourceSquare, targetSquare)
          setShowMoveArrow(false)

          // Play sound
          if (settings.playSounds) {
            if (gameCopy.isCheckmate()) playSound('checkmate')
            else if (gameCopy.isCheck()) playSound('check')
            else if (move.captured) playSound('capture')
            else playSound('move')
          }

          // Clear status
          setTimeout(() => setMoveStatus(null), 800)

          // Advance step
          const nextIndex = currentStepIndex + 1
          setCurrentStepIndex(nextIndex)

          // Handle computer response
          if (currentStep.computerMove) {
            setTimeout(() => {
              const computerGame = new Chess(gameCopy.fen())
              const computerMove = computerGame.move(currentStep.computerMove!)

              if (computerMove) {
                setGame(computerGame)
                const computerFen = computerGame.fen()
                setMoveHistory((prev) => [...prev, computerFen])
                setFullHistory((prev) => [...prev, computerFen])
                highlightMove(computerMove.from, computerMove.to)

                // Play computer move sound
                if (settings.playSounds) {
                  if (computerGame.isCheckmate()) playSound('checkmate')
                  else if (computerGame.isCheck()) playSound('check')
                  else if (computerMove.captured) playSound('capture')
                  else playSound('move')
                }
              }
            }, 250)
          }

          // Check completion
          if (nextIndex >= moves.length) {
            completeExercise()
            if (settings.showConfetti) {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              })
            }
          }

          return true
        } else {
          // Incorrect move - execute it visually, then revert
          const currentFen = game.fen() // Save current position

          // Execute the move visually
          setGame(gameCopy)
          setMoveStatus('incorrect')
          highlightMove(sourceSquare, targetSquare)
          clearSelection()

          // Play sound
          if (settings.playSounds) {
            if (gameCopy.isCheckmate()) playSound('checkmate')
            else if (gameCopy.isCheck()) playSound('check')
            else if (move.captured) playSound('capture')
            else playSound('move')
          }

          // Revert after showing feedback
          setTimeout(() => {
            setGame(new Chess(currentFen))
            setMoveStatus(null)
          }, 800)

          return false
        }
      },
      [
        game,
        isCompleted,
        interactive,
        isViewMode,
        currentStep,
        currentStepIndex,
        moves,
        settings,
        setGame,
        setMoveStatus,
        setMoveHistory,
        setFullHistory,
        setCurrentStepIndex,
        clearSelection,
        highlightMove,
        setShowMoveArrow,
        completeExercise,
      ]
    )

    /**
     * Drag handler - show legal moves when dragging a piece
     */
    const onPieceDrag = useCallback(
      ({ square }: PieceHandlerArgs) => {
        if (!settings.showLegalMoves || !square) return

        // @ts-expect-error - chess.js types are strict, but our strings are valid squares
        const pieceData = game.get(square)
        if (!pieceData || pieceData.color !== game.turn()) return

        // Highlight the source square
        const highlights: SquareStyles = {
          [square]: { backgroundColor: 'rgba(20, 85, 30, 0.5)' }, // Lichess green
        }

        // Add legal move highlights
        const legalMoves = getLegalMovesForSquare(game, square)
        const legalMoveHighlights = createLegalMoveHighlights(legalMoves)
        Object.assign(highlights, legalMoveHighlights)

        setHighlightSquares(highlights)
      },
      [game, settings.showLegalMoves, setHighlightSquares]
    )

    /**
     * Drag and drop handler
     */
    const onPieceDrop = useCallback(
      ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
        if (!targetSquare || sourceSquare === targetSquare) {
          // Clear highlights on cancelled drag
          clearSelection()
          return false
        }

        setIsDragging(true)
        const result = makeMove(sourceSquare, targetSquare)
        setTimeout(() => setIsDragging(false), 100)
        return result
      },
      [makeMove, setIsDragging, clearSelection]
    )

    /**
     * Click handler for click-to-move
     */
    const onSquareClick = useCallback(
      ({ square }: { square: string }) => {
        if (isDragging || isCompleted || !interactive || isViewMode) return

        // @ts-expect-error - chess.js types are strict, but our strings are valid squares
        const piece = game.get(square)

        if (selectedSquare) {
          // If clicking on another piece of the same color, select it instead of moving
          if (piece && piece.color === game.turn()) {
            selectSquare(square)
          } else {
            // Try to move
            const moved = makeMove(selectedSquare, square)
            // If move failed, clear selection
            if (!moved) {
              clearSelection()
            }
          }
        } else if (piece && piece.color === game.turn()) {
          // Select piece
          selectSquare(square)
        }
      },
      [isDragging, isCompleted, interactive, isViewMode, game, selectedSquare, makeMove, selectSquare, clearSelection]
    )

    /**
     * Right-click handler - clear selection
     */
    const onSquareRightClick = useCallback(() => {
      clearSelection()
    }, [clearSelection])

    /**
     * Toggle hint text visibility
     */
    const toggleHintText = useCallback(() => {
      setShowHint((prev) => {
        if (prev) {
          // Hide arrow when closing hint
          setShowMoveArrow(false)
        }
        return !prev
      })
    }, [setShowMoveArrow])

    /**
     * Toggle move arrow visibility
     */
    const toggleMoveArrow = useCallback(() => {
      setShowMoveArrow((prev) => !prev)
    }, [setShowMoveArrow])

    /**
     * Combined highlights (move + check/checkmate)
     */
    const combinedHighlights = useMemo(() => {
      const checkHighlights = getCheckHighlights(game)
      return { ...highlightSquares, ...checkHighlights }
    }, [game, highlightSquares])

    /**
     * Arrow coordinates for hint
     */
    const arrowCoords = useMemo(() => {
      if (!showMoveArrow || !currentStep?.correctMove) return null
      return getArrowCoords(game, currentStep.correctMove)
    }, [showMoveArrow, game, currentStep])

    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-[500px] mx-auto">
        {/* Hint Panel */}
        {currentStep?.description && (
          <HintPanel
            description={currentStep.description}
            hint={hint}
            showHint={showHint}
            onToggleHint={toggleHintText}
            onRevealMove={toggleMoveArrow}
            isMoveRevealed={showMoveArrow}
            isCompleted={wasEverCompleted}
          />
        )}
        {/* Move Title */}
        <div className="w-full h-[20px]">
          {moves.length > 0 && <h3 className="text-sm font-semibold text-(--brown-bg)">Move {displayStepIndex + 1}</h3>}
        </div>

        {/* Chess Board */}
        <div
          className="relative w-full aspect-square shadow-xl rounded-sm overflow-hidden bg-[#F0D9B5] [&_img]:scale-110"
          onContextMenu={(e) => {
            e.preventDefault()
          }}
        >
          {/* Chessboard with conditional blur */}
          <div className={`transition-all duration-150 ${isCompleted ? 'blur-[1px]' : ''}`}>
            <Chessboard
              key={initialFen}
              options={{
                position: game.fen(),
                onPieceDrag,
                onPieceDrop,
                onSquareClick,
                onSquareRightClick,
                allowDragging: interactive && !isCompleted && !isViewMode,
                animationDurationInMs: settings.pieceSpeed,
                squareStyles: combinedHighlights,
                dropSquareStyle: { boxShadow: 'none' },
              }}
            />

            {/* Hint Arrow */}
            {arrowCoords && <HintArrow coords={arrowCoords} />}
          </div>

          {/* Move Feedback - Outside blur wrapper so it stays sharp */}
          <MoveFeedback status={moveStatus} isCompleted={isCompleted} />
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-between gap-2">
          <ExerciseControls
            onRestart={handleReset}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={moveHistory.length > 1}
            canRedo={moveHistory.length < fullHistory.length}
          />
          <BoardSettingsPanel />
        </div>

        {/* Progress Bar */}
        {moves.length > 0 && (
          <div className="w-full">
            <div className="w-full h-2 rounded-full overflow-hidden bg-gray-200">
              <div
                className="h-full bg-(--brown-bg) rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, progressPercentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
)

ChessBoardComponent.displayName = 'ChessBoardComponent'

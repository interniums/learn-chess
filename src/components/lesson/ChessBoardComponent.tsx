/**
 * Refactored Chess Board Component
 * Clean, maintainable, and performant implementation
 */

'use client'

import { useCallback, useMemo, memo, useState, useRef } from 'react'
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
import { getCheckHighlights, getLegalMovesForSquare, createLegalMoveHighlights } from '@/utils/chess'
import type { SquareStyles } from '@/utils/chess'

// Components
import { HintArrow } from './HintArrow'
import { HintPanel } from './HintPanel'
import { ExerciseControls } from './ExerciseControls'
import { BoardSettingsPanel } from './BoardSettingsPanel'
import { Button } from '../ui/button'

// Types
import type { GoalExerciseConfig } from '@/types/chess'

type DemoConfig = {
  moves: string[]
  description?: string
}

interface ChessBoardComponentProps {
  initialFen: string
  goal: GoalExerciseConfig
  hint?: string
  interactive?: boolean
  onComplete?: () => void
  exerciseId: string
  demo?: DemoConfig
}

export const ChessBoardComponent = memo(
  ({ initialFen, goal, hint, interactive = true, onComplete, exerciseId, demo }: ChessBoardComponentProps) => {
    const { settings } = useBoardSettings()

    // Game state management
    const {
      game,
      setGame,
      moveHistory,
      setMoveHistory,
      fullHistory,
      setFullHistory,
      isCompleted,
      wasEverCompleted,
      resetGame,
      undoMove,
      redoMove,
      completeExercise,
    } = useChessGame({
      exerciseId,
      startPosition: initialFen,
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

    // Demo mode state
    const [isDemoMode, setIsDemoMode] = useState(false)
    const [demoIndex, setDemoIndex] = useState(0) // 0 = initial position, 1..n = after n moves
    const [demoFen, setDemoFen] = useState<string | null>(null)

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

    // Hint & goal evaluation state
    const [showHint, setShowHint] = useState(false)
    const [hasUsedHelp, setHasUsedHelp] = useState(false)
    const [userMoveCount, setUserMoveCount] = useState(0) // moves made by the trainee side
    const [starRating, setStarRating] = useState<number | null>(null)
    const [resultText, setResultText] = useState<string | null>(null)
    const [moveComment, setMoveComment] = useState<string | null>(null)

    const traineeColor = goal.sideToMove
    const evalRequestIdRef = useRef(0)

    const evaluateMaterial = useCallback((g: Chess, color: 'w' | 'b') => {
      const board = g.board()
      const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
      let sum = 0
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = board[i][j]
          if (piece && piece.color === color) {
            sum += pieceValues[piece.type] ?? 0
          }
        }
      }
      return sum
    }, [])

    const evaluateAndSetMoveComment = useCallback(
      (prevFen: string, nextFen: string, movingColor: 'w' | 'b') => {
        if (movingColor !== traineeColor) return

        const id = ++evalRequestIdRef.current
        const prevGame = new Chess(prevFen)
        const nextGame = new Chess(nextFen)

        if (nextGame.isCheckmate()) {
          const text = 'Brilliant! You delivered checkmate.'
          setMoveComment(text)
          setTimeout(() => {
            if (evalRequestIdRef.current === id) setMoveComment(null)
          }, 2500)
          return
        }

        const enemy: 'w' | 'b' = movingColor === 'w' ? 'b' : 'w'

        const prevMaterial = evaluateMaterial(prevGame, movingColor) - evaluateMaterial(prevGame, enemy)
        const nextMaterial = evaluateMaterial(nextGame, movingColor) - evaluateMaterial(nextGame, enemy)
        const diff = nextMaterial - prevMaterial

        let text: string
        if (diff >= 2) text = 'Great move! You gained material or improved your position.'
        else if (diff >= 0) text = 'Good move.'
        else if (diff > -1) text = 'This move is okay, but you had better options.'
        else if (diff > -3) text = 'This move is a mistake and worsens your position.'
        else text = 'This move loses significant material.'

        setMoveComment(text)
        setTimeout(() => {
          if (evalRequestIdRef.current === id) setMoveComment(null)
        }, 2500)
      },
      [evaluateMaterial, traineeColor]
    )

    const checkAndRateGoal = useCallback(
      (gameAfter: Chess, lastMoveColor: 'w' | 'b', totalUserMoves: number) => {
        if (goal.goalType === 'mate') {
          if (gameAfter.isCheckmate()) {
            // user delivered mate
            if (lastMoveColor === traineeColor) {
              const { idealMoves, goodMoves, maxMoves } = goal.rating
              let stars = 1
              if (totalUserMoves <= idealMoves) stars = 3
              else if (totalUserMoves <= goodMoves) stars = 2

              if (hasUsedHelp && stars === 3) {
                stars = 2
              }

              if (maxMoves && totalUserMoves > maxMoves) {
                stars = 1
              }

              const message =
                stars === 3
                  ? `Perfect! Mate in ${totalUserMoves} moves.`
                  : stars === 2
                  ? `Good job! Mate in ${totalUserMoves} moves.`
                  : `You achieved mate in ${totalUserMoves} moves.`

              setStarRating(stars)
              setResultText(message)
              completeExercise()
              if (settings.showConfetti && stars > 0) {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                })
              }
            } else {
              // trainee got checkmated
              setStarRating(0)
              setResultText('You were checkmated. Try again and defend better.')
              completeExercise()
            }
          } else if (goal.rating.maxMoves && totalUserMoves > goal.rating.maxMoves) {
            setStarRating(0)
            setResultText('Goal not achieved in the allowed number of moves.')
            completeExercise()
          }
        }
      },
      [goal, traineeColor, hasUsedHelp, completeExercise, settings.showConfetti]
    )

    /**
     * Handle move execution
     */
    const makeMove = useCallback(
      (sourceSquare: string, targetSquare: string): boolean => {
        if (isCompleted || !interactive || isDemoMode) return false

        const prevFen = game.fen()
        const gameCopy = new Chess(prevFen)
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

        // Accept any legal move
        setGame(gameCopy)
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

        // Count trainee moves and evaluate
        if (piece.color === traineeColor) {
          const totalUserMoves = userMoveCount + 1
          setUserMoveCount(totalUserMoves)
          evaluateAndSetMoveComment(prevFen, newFen, piece.color)
          checkAndRateGoal(gameCopy, piece.color, totalUserMoves)
        } else {
          // Opponent move – still check goal (they might checkmate us)
          checkAndRateGoal(gameCopy, piece.color, userMoveCount)
        }

        return true
      },
      [
        game,
        isCompleted,
        interactive,
        isDemoMode,
        traineeColor,
        userMoveCount,
        settings.playSounds,
        setGame,
        setMoveHistory,
        setFullHistory,
        clearSelection,
        highlightMove,
        setShowMoveArrow,
        evaluateAndSetMoveComment,
        checkAndRateGoal,
      ]
    )

    /**
     * Drag handler - show legal moves when dragging a piece
     */
    const onPieceDrag = useCallback(
      ({ square }: PieceHandlerArgs) => {
        if (!settings.showLegalMoves || !square || isDemoMode) return

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
      [game, settings.showLegalMoves, setHighlightSquares, isDemoMode]
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
        if (isDragging || isCompleted || !interactive || isDemoMode) return

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
      [
        isDragging,
        isCompleted,
        interactive,
        isDemoMode,
        game,
        selectedSquare,
        makeMove,
        selectSquare,
        clearSelection,
      ]
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
        if (!prev) {
          // User is opening the hint
          setHasUsedHelp(true)
        } else {
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
      setHasUsedHelp(true)
      setShowMoveArrow((prev) => !prev)
    }, [setShowMoveArrow])

    /**
     * Combined highlights (move + check/checkmate)
     */
    const combinedHighlights = useMemo(() => {
      const baseFen = isDemoMode && demoFen ? demoFen : game.fen()
      const baseGame = new Chess(baseFen)
      const checkHighlights = getCheckHighlights(baseGame)
      return { ...highlightSquares, ...checkHighlights }
    }, [game, highlightSquares, isDemoMode, demoFen])

    /**
     * Arrow coordinates for hint.
     * For now, we don't reveal a specific move in goal mode.
     */
    const arrowCoords = useMemo(() => {
      if (!showMoveArrow) return null
      return null
    }, [showMoveArrow])

    const hasDemo = !!demo && Array.isArray(demo.moves) && demo.moves.length > 0

    const goToDemoIndex = useCallback(
      (targetIndex: number) => {
        if (!hasDemo) return
        const totalMoves = demo!.moves.length
        const clampedIndex = Math.max(0, Math.min(targetIndex, totalMoves))

        const demoGame = new Chess(initialFen)
        let lastMove: any = null

        for (let i = 0; i < clampedIndex; i++) {
          const moveSan = demo!.moves[i]
          try {
            lastMove = demoGame.move(moveSan)
          } catch {
            break
          }
        }

        setDemoFen(demoGame.fen())
        setDemoIndex(clampedIndex)
        clearSelection()

        if (lastMove && lastMove.from && lastMove.to) {
          highlightMove(lastMove.from, lastMove.to)
        } else {
          setHighlightSquares({})
        }
      },
      [clearSelection, demo, hasDemo, highlightMove, initialFen, setHighlightSquares]
    )

    const handleEnterDemo = useCallback(() => {
      if (!hasDemo) return
      setIsDemoMode(true)
      goToDemoIndex(0)
    }, [goToDemoIndex, hasDemo])

    const handleExitDemo = useCallback(() => {
      setIsDemoMode(false)
      setDemoIndex(0)
      setDemoFen(null)
      clearSelection()
    }, [clearSelection])

    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-[500px] mx-auto">
        {/* Hint Panel */}
        {goal.description && (
          <HintPanel
            description={goal.description}
            hint={hint}
            showHint={showHint}
            onToggleHint={toggleHintText}
            onRevealMove={toggleMoveArrow}
            isMoveRevealed={showMoveArrow}
            isCompleted={wasEverCompleted}
          />
        )}

        {/* Simple move counter */}
        <div className="w-full h-[20px] flex items-center justify-end">
          <span className="text-sm font-semibold text-(--brown-bg)">Your moves: {userMoveCount}</span>
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
                position: isDemoMode && demoFen ? demoFen : game.fen(),
                onPieceDrag,
                onPieceDrop,
                onSquareClick,
                onSquareRightClick,
                allowDragging: interactive && !isCompleted && !isDemoMode,
                animationDurationInMs: settings.pieceSpeed,
                squareStyles: combinedHighlights,
                dropSquareStyle: { boxShadow: 'none' },
              }}
            />

            {/* Hint Arrow - currently not used in goal mode */}
            {arrowCoords && <HintArrow coords={arrowCoords} />}
          </div>

          {/* Star result overlay */}
          {isCompleted && starRating !== null && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40">
              <div className="bg-white rounded-xl p-4 shadow-xl text-center space-y-2">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`text-2xl ${i <= starRating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm font-semibold text-(--default-black)">
                  {resultText ?? `Completed in ${userMoveCount} moves.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Move quality comment */}
        {moveComment && !isCompleted && (
          <div className="w-full text-center text-sm text-slate-700">{moveComment}</div>
        )}

        {/* Controls */}
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {hasDemo && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-(--default-black) hover:bg-slate-100"
                  onClick={isDemoMode ? handleExitDemo : handleEnterDemo}
                >
                  {isDemoMode ? 'Back to exercise' : 'Watch demo'}
                </Button>
                {isDemoMode && (
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 border-slate-300 hover:bg-slate-100"
                      onClick={() => goToDemoIndex(demoIndex - 1)}
                      disabled={demoIndex === 0}
                    >
                      ◀
                    </Button>
                    <span>
                      {demoIndex}/{demo!.moves.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 border-slate-300 hover:bg-slate-100"
                      onClick={() => goToDemoIndex(demoIndex + 1)}
                      disabled={demoIndex === demo!.moves.length}
                    >
                      ▶
                    </Button>
                  </div>
                )}
              </div>
            )}

            <ExerciseControls
              onRestart={handleReset}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={!isDemoMode && moveHistory.length > 1}
              canRedo={!isDemoMode && moveHistory.length < fullHistory.length}
            />
          </div>
          <BoardSettingsPanel />
        </div>
      </div>
    )
  }
)

ChessBoardComponent.displayName = 'ChessBoardComponent'

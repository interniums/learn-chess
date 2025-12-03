/**
 * Custom hook for managing chess game state
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import type { ExerciseStep, MoveStatus, SavedProgress } from '@/types/chess'

interface UseChessGameProps {
  exerciseId: string
  startPosition: string
  moves: ExerciseStep[]
  onComplete?: () => void
}

export const useChessGame = ({ exerciseId, startPosition, moves, onComplete }: UseChessGameProps) => {
  const [game, setGame] = useState<Chess>(new Chess(startPosition))
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [moveHistory, setMoveHistory] = useState<string[]>([startPosition])
  const [fullHistory, setFullHistory] = useState<string[]>([startPosition]) // Full history including undone moves
  const [isCompleted, setIsCompleted] = useState(false)
  const [wasEverCompleted, setWasEverCompleted] = useState(false) // Track if exercise was ever completed
  const [moveStatus, setMoveStatus] = useState<MoveStatus>(null)
  const [isViewMode, setIsViewMode] = useState(false) // View-only mode when navigating history
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false) // Ensure we don't overwrite saved state on first mount

  const startPositionRef = useRef(startPosition)

  // Load saved progress from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const savedKey = `exercise-progress-${exerciseId}`
    const saved = localStorage.getItem(savedKey)

    if (saved) {
      try {
        const progress: SavedProgress = JSON.parse(saved)
        setCurrentStepIndex(progress.currentStepIndex)
        setMoveHistory(progress.moveHistory)
        setFullHistory(progress.moveHistory) // Initialize fullHistory with current moveHistory
        setIsCompleted(progress.isCompleted)

        // Restore game to last position
        const lastFen = progress.moveHistory[progress.moveHistory.length - 1]
        setGame(new Chess(lastFen))
      } catch (error) {
        console.error('Failed to load saved progress:', error)
      } finally {
        setHasLoadedProgress(true)
      }
    } else {
      // No saved progress – mark as loaded so we can start persisting fresh state
      setHasLoadedProgress(true)
    }
  }, [exerciseId])

  // Save progress to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedProgress) {
      return
    }

    const savedKey = `exercise-progress-${exerciseId}`
    const progress: SavedProgress = {
      currentStepIndex,
      moveHistory,
      isCompleted,
    }
    localStorage.setItem(savedKey, JSON.stringify(progress))
  }, [exerciseId, currentStepIndex, moveHistory, isCompleted, hasLoadedProgress])

  // Reset game when startPosition changes
  useEffect(() => {
    if (startPosition !== startPositionRef.current) {
      setGame(new Chess(startPosition))
      setCurrentStepIndex(0)
      setMoveHistory([startPosition])
      setFullHistory([startPosition]) // Reset full history too
      setIsCompleted(false)
      setMoveStatus(null)
      startPositionRef.current = startPosition
    }
  }, [startPosition])

  const resetGame = useCallback(() => {
    setGame(new Chess(startPosition))
    setCurrentStepIndex(0)
    setMoveHistory([startPosition])
    setFullHistory([startPosition]) // Reset full history too
    setIsCompleted(false)
    setWasEverCompleted(false) // Reset completion tracking
    setMoveStatus(null)
    setIsViewMode(false) // Exit view mode

    // Clear saved progress
    if (typeof window !== 'undefined') {
      const savedKey = `exercise-progress-${exerciseId}`
      localStorage.removeItem(savedKey)
    }
  }, [startPosition, exerciseId])

  const undoMove = useCallback(() => {
    if (moveHistory.length <= 1 || currentStepIndex === 0) return

    // Enter view mode when going back in history
    setIsViewMode(true)

    // Check if the previous step had a computer move
    const previousStep = moves[currentStepIndex - 1]
    const stepsToRemove = previousStep?.computerMove ? 2 : 1

    const newHistory = moveHistory.slice(0, -stepsToRemove)
    const previousFen = newHistory[newHistory.length - 1]

    setGame(new Chess(previousFen))
    setMoveHistory(newHistory)
    setCurrentStepIndex((prev: number) => Math.max(0, prev - 1))
    setIsCompleted(false)
    setMoveStatus(null)
  }, [moveHistory, currentStepIndex, moves])

  const redoMove = useCallback(() => {
    // Check if there are moves to redo
    if (moveHistory.length >= fullHistory.length) return

    // Check if the current step has a computer move
    const currentStep = moves[currentStepIndex]
    const stepsToAdd = currentStep?.computerMove ? 2 : 1

    const newHistoryLength = Math.min(moveHistory.length + stepsToAdd, fullHistory.length)
    const newHistory = fullHistory.slice(0, newHistoryLength)
    const newFen = newHistory[newHistory.length - 1]

    setGame(new Chess(newFen))
    setMoveHistory(newHistory)
    setCurrentStepIndex((prev: number) => Math.min(prev + 1, moves.length))
    setMoveStatus(null)

    // Exit view mode if we've reached the current position (no more moves to redo)
    if (newHistoryLength >= fullHistory.length) {
      setIsViewMode(false)
    }
  }, [moveHistory, fullHistory, currentStepIndex, moves])

  const completeExercise = useCallback(() => {
    setIsCompleted(true)
    setWasEverCompleted(true) // Mark as ever completed
    if (onComplete) {
      onComplete()
    }
  }, [onComplete])

  return {
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
    setIsViewMode,
    moveStatus,
    setMoveStatus,
    resetGame,
    undoMove,
    redoMove,
    completeExercise,
  }
}

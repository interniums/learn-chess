/**
 * Custom hook for managing chess game state for goal-based exercises
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import type { MoveStatus, SavedProgress } from '@/types/chess'

interface UseChessGameProps {
  exerciseId: string
  startPosition: string
  onComplete?: () => void
}

export const useChessGame = ({ exerciseId, startPosition, onComplete }: UseChessGameProps) => {
  const [game, setGame] = useState<Chess>(new Chess(startPosition))
  const [moveHistory, setMoveHistory] = useState<string[]>([startPosition])
  const [fullHistory, setFullHistory] = useState<string[]>([startPosition]) // Full history including undone moves
  const [isCompleted, setIsCompleted] = useState(false)
  const [wasEverCompleted, setWasEverCompleted] = useState(false)
  const [moveStatus, setMoveStatus] = useState<MoveStatus>(null)
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
        setMoveHistory(progress.moveHistory)
        setFullHistory(progress.moveHistory) // Initialize fullHistory with current moveHistory
        setIsCompleted(progress.isCompleted)
        if (progress.isCompleted) {
          setWasEverCompleted(true)
        }

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
      moveHistory,
      isCompleted,
    }
    localStorage.setItem(savedKey, JSON.stringify(progress))
  }, [exerciseId, moveHistory, isCompleted, hasLoadedProgress])

  // Reset game when startPosition changes
  useEffect(() => {
    if (startPosition !== startPositionRef.current) {
      setGame(new Chess(startPosition))
      setMoveHistory([startPosition])
      setFullHistory([startPosition]) // Reset full history too
      setIsCompleted(false)
      setMoveStatus(null)
      setWasEverCompleted(false)
      startPositionRef.current = startPosition
    }
  }, [startPosition])

  const resetGame = useCallback(() => {
    setGame(new Chess(startPosition))
    setMoveHistory([startPosition])
    setFullHistory([startPosition]) // Reset full history too
    setIsCompleted(false)
    setWasEverCompleted(false)
    setMoveStatus(null)

    // Clear saved progress
    if (typeof window !== 'undefined') {
      const savedKey = `exercise-progress-${exerciseId}`
      localStorage.removeItem(savedKey)
    }
  }, [startPosition, exerciseId])

  const undoMove = useCallback(() => {
    if (moveHistory.length <= 1) return

    const newHistory = moveHistory.slice(0, -1)
    const previousFen = newHistory[newHistory.length - 1]

    setGame(new Chess(previousFen))
    setMoveHistory(newHistory)
    setIsCompleted(false)
    setMoveStatus(null)
  }, [moveHistory])

  const redoMove = useCallback(() => {
    // Check if there are moves to redo
    if (moveHistory.length >= fullHistory.length) return

    const newHistoryLength = moveHistory.length + 1
    const newHistory = fullHistory.slice(0, newHistoryLength)
    const newFen = newHistory[newHistory.length - 1]

    setGame(new Chess(newFen))
    setMoveHistory(newHistory)
    setMoveStatus(null)
  }, [moveHistory, fullHistory])

  const completeExercise = useCallback(() => {
    setIsCompleted(true)
    setWasEverCompleted(true)
    if (onComplete) {
      onComplete()
    }
  }, [onComplete])

  return {
    game,
    setGame,
    moveHistory,
    setMoveHistory,
    fullHistory,
    setFullHistory,
    isCompleted,
    wasEverCompleted,
    moveStatus,
    setMoveStatus,
    resetGame,
    undoMove,
    redoMove,
    completeExercise,
  }
}

/**
 * Custom hook for managing board interactions (clicks, highlights, etc.)
 */

import { useState, useCallback } from 'react'
import type { SquareStyles } from '@/utils/chess'
import { getLegalMovesForSquare, createLegalMoveHighlights, createMoveHighlights } from '@/utils/chess'
import { Chess } from 'chess.js'

export const useBoardInteraction = (game: Chess, showLegalMoves: boolean) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [highlightSquares, setHighlightSquares] = useState<SquareStyles>({})
  const [isDragging, setIsDragging] = useState(false)
  const [showMoveArrow, setShowMoveArrow] = useState(false)

  const clearSelection = useCallback(() => {
    setSelectedSquare(null)
    setHighlightSquares({})
  }, [])

  const selectSquare = useCallback(
    (square: string) => {
      // @ts-expect-error - chess.js types are strict, but our strings are valid squares
      const piece = game.get(square)
      if (!piece || piece.color !== game.turn()) {
        clearSelection()
        return
      }

      setSelectedSquare(square)

      // Highlight the selected square (Lichess style)
      const highlights: SquareStyles = {
        [square]: { backgroundColor: 'rgba(20, 85, 30, 0.5)' }, // Lichess green
      }

      if (showLegalMoves) {
        const legalMoves = getLegalMovesForSquare(game, square)
        const legalMoveHighlights = createLegalMoveHighlights(legalMoves)
        // Merge selected square highlight with legal move highlights
        Object.assign(highlights, legalMoveHighlights)
      }

      setHighlightSquares(highlights)
    },
    [game, showLegalMoves, clearSelection]
  )

  const highlightMove = useCallback((from: string, to: string) => {
    const highlights = createMoveHighlights(from, to)
    setHighlightSquares(highlights)
  }, [])

  return {
    selectedSquare,
    setSelectedSquare,
    highlightSquares,
    setHighlightSquares, // Expose for drag handler
    isDragging,
    setIsDragging,
    showMoveArrow,
    setShowMoveArrow,
    clearSelection,
    selectSquare,
    highlightMove,
  }
}

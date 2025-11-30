/**
 * Chess game utilities
 */

import { Chess } from 'chess.js'

/**
 * Square style for highlighting
 */
export type SquareStyles = Record<string, React.CSSProperties>

/**
 * Get check/checkmate highlights for the board
 */
export const getCheckHighlights = (game: Chess): SquareStyles => {
  const highlights: SquareStyles = {}

  if (game.isCheckmate()) {
    // Find the king in checkmate - Lichess style with gradient
    const turn = game.turn()
    const board = game.board()
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j]
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = String.fromCharCode(97 + j)
          const rank = String(8 - i)
          const square = file + rank
          // Lichess-style checkmate: radial gradient from center
          highlights[square] = {
            background:
              'radial-gradient(ellipse at center, rgba(255, 0, 0, 1) 0%, rgba(231, 0, 0, 1) 25%, rgba(169, 0, 0, 0) 89%, rgba(158, 0, 0, 0) 100%)',
          }
        }
      }
    }
  } else if (game.isCheck()) {
    // Find the king in check - Lichess style
    const turn = game.turn()
    const board = game.board()
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j]
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = String.fromCharCode(97 + j)
          const rank = String(8 - i)
          const square = file + rank
          // Lichess-style check: radial gradient, less intense
          highlights[square] = {
            background:
              'radial-gradient(ellipse at center, rgba(255, 0, 0, 0.8) 0%, rgba(231, 0, 0, 0.8) 25%, rgba(169, 0, 0, 0) 89%, rgba(158, 0, 0, 0) 100%)',
          }
        }
      }
    }
  }

  return highlights
}

/**
 * Get legal moves for a piece on a square
 */
export const getLegalMovesForSquare = (game: Chess, square: string): string[] => {
  // @ts-expect-error - chess.js types are strict, but our strings are valid squares
  const moves = game.moves({ square, verbose: true })
  // @ts-expect-error - moves is an array of Move objects when verbose is true
  return moves.map((move) => move.to)
}

/**
 * Create highlight styles for legal move dots (Lichess style)
 */
export const createLegalMoveHighlights = (squares: string[]): SquareStyles => {
  const highlights: SquareStyles = {}
  squares.forEach((square) => {
    highlights[square] = {
      background: 'radial-gradient(circle, rgba(20, 85, 30, 0.5) 19%, transparent 20%)',
      borderRadius: '50%',
    }
  })
  return highlights
}

/**
 * Create highlight styles for move (from/to squares) - Lichess style
 */
export const createMoveHighlights = (from: string, to: string): SquareStyles => {
  return {
    [from]: { backgroundColor: 'rgba(155, 199, 0, 0.41)' }, // Lichess yellow-green
    [to]: { backgroundColor: 'rgba(155, 199, 0, 0.41)' },
  }
}

/**
 * Convert square notation to coordinates (0-7)
 */
export const squareToCoords = (square: string): { x: number; y: number } => {
  const file = square.charCodeAt(0) - 97 // 'a' = 0, 'b' = 1, etc.
  const rank = 8 - parseInt(square[1]) // '8' = 0, '7' = 1, etc.
  return { x: file, y: rank }
}

/**
 * Get arrow coordinates for displaying a move hint
 */
export const getArrowCoords = (
  game: Chess,
  moveNotation: string
): { x1: number; y1: number; x2: number; y2: number } | null => {
  try {
    const tempGame = new Chess(game.fen())
    const move = tempGame.move(moveNotation)
    if (!move) return null

    const fromCoords = squareToCoords(move.from)
    const toCoords = squareToCoords(move.to)

    return {
      x1: (fromCoords.x + 0.5) * 12.5,
      y1: (fromCoords.y + 0.5) * 12.5,
      x2: (toCoords.x + 0.5) * 12.5,
      y2: (toCoords.y + 0.5) * 12.5,
    }
  } catch {
    return null
  }
}

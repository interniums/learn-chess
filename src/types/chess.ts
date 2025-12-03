/**
 * Type definitions for chess components
 */

/**
 * Premove state
 */
export interface Premove {
  from: string
  to: string
}

/**
 * Move status for visual feedback
 */
export type MoveStatus = 'correct' | 'incorrect' | null

/**
 * Goal-based exercise configuration
 * Used for free-play exercises where the user can make any legal move
 * and must achieve a goal within certain move limits.
 */
export type GoalType = 'mate' | 'winMaterial' | 'promotePawn'

export interface GoalRatingConfig {
  /** 3★ if finished in ≤ idealMoves (and without help) */
  idealMoves: number
  /** 2★ if finished in ≤ goodMoves */
  goodMoves: number
  /** Optional: fail/0★ if moves exceed this */
  maxMoves?: number
}

export interface GoalExerciseConfig {
  goalType: GoalType
  /** Color we evaluate from / the side being trained */
  sideToMove: 'w' | 'b'
  /** Text description of the goal, e.g. "Mate with rook and king" */
  description: string
  rating: GoalRatingConfig
}

/**
 * Simple move quality buckets for per-move feedback
 */
export type MoveQuality = 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export interface MoveEvaluation {
  quality: MoveQuality
  /** Difference in evaluation (e.g. centipawns) from the mover's perspective */
  scoreDiff: number
}

/**
 * Saved exercise progress for a goal-based exercise
 */
export interface SavedProgress {
  moveHistory: string[]
  isCompleted: boolean
}

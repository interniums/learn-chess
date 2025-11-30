/**
 * Type definitions for chess components
 */

/**
 * Exercise step data structure (matches database JSON)
 */
export interface ExerciseStep {
  id: number
  correctMove: string
  description: string
  acceptedMoves?: string[]
  computerMove?: string | null
}

/**
 * Alias for backward compatibility
 */
export type MoveStep = ExerciseStep

/**
 * Exercise data structure from database
 */
export interface ExerciseData {
  startPosition: string
  moves: ExerciseStep[]
  description?: string
}

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
 * Saved exercise progress
 */
export interface SavedProgress {
  currentStepIndex: number
  moveHistory: string[]
  isCompleted: boolean
}

/**
 * Sound utilities for chess moves
 * Uses Lichess-style sound files
 *
 * Sound files needed in /public/sounds/:
 * - Move.mp3: Regular piece movement
 * - Capture.mp3: Piece capture
 * - GenericNotify.mp3: Check notification (sharp, alert sound)
 * - Victory.mp3: Checkmate (triumphant, final sound)
 */

export type SoundType = 'move' | 'capture' | 'check' | 'checkmate'

/**
 * Play a chess sound effect
 * @param type - Type of sound to play
 * @param volume - Volume level (0-1), defaults to 0.5
 */
export const playSound = (type: SoundType, volume = 0.5): void => {
  let soundFile = '/sounds/Move.mp3'

  switch (type) {
    case 'capture':
      soundFile = '/sounds/Capture.mp3'
      break
    case 'checkmate':
      // Try Victory.mp3 first, fallback to GenericNotify.mp3 if not available
      soundFile = '/sounds/GenericNotify.mp3'
      break
    default:
      soundFile = '/sounds/Move.mp3'
  }

  const audio = new Audio(soundFile)
  audio.volume = volume

  audio.play().catch((error) => {
    console.error(`Error playing ${type} sound:`, error)
  })
}

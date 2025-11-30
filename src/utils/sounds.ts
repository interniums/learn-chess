/**
 * Sound utilities for chess moves
 * Uses Lichess sound files
 */

export type SoundType = 'move' | 'capture' | 'check' | 'checkmate'

/**
 * Play a chess sound effect
 * @param type - Type of sound to play
 * @param volume - Volume level (0-1), defaults to 0.5
 */
export const playSound = (type: SoundType, volume = 0.5): void => {
  let soundFile = '/sounds/Move.mp3'

  if (type === 'capture') {
    soundFile = '/sounds/Capture.mp3'
  } else if (type === 'check' || type === 'checkmate') {
    soundFile = '/sounds/GenericNotify.mp3'
  }

  const audio = new Audio(soundFile)
  audio.volume = volume
  audio.play().catch((error) => {
    console.error('Error playing sound:', error)
  })
}

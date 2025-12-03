# Chess Sound Files

This directory contains sound effects for the chess application.

## Current Files

- **Move.mp3** - Regular piece movement sound
- **Capture.mp3** - Piece capture sound
- **GenericNotify.mp3** - Check notification (sharp alert)

## Missing Files (Recommended)

- **Victory.mp3** - Checkmate sound (triumphant, final sound)
  - Should be more dramatic and conclusive than GenericNotify.mp3
  - Recommended: A triumphant chord or victory fanfare
  - Duration: 1-2 seconds
  - Currently falls back to GenericNotify.mp3 if not present

## Sound Guidelines

- **Check**: Should be a sharp, brief alert to grab attention
- **Checkmate**: Should be longer and more conclusive to signify game end
- **Volume**: All sounds should be normalized to similar peak levels
- **Format**: MP3 format, 44.1kHz sample rate recommended

## Sources for Victory Sound

You can find suitable checkmate/victory sounds from:
- Lichess sound assets (if available)
- Free sound libraries (Pixabay, Freesound)
- Create custom sound using audio editing software

## Adding Victory.mp3

1. Find or create a suitable victory/checkmate sound
2. Save it as `Victory.mp3` in this directory
3. The app will automatically use it for checkmate events


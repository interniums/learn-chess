-- FORCE UPDATE ALL EXERCISES
-- This is a dev-only script to ensure the exercise content is updated regardless of lesson slug.
-- WARNING: This updates ALL rows with type = 'exercise'.

UPDATE lesson_contents
SET content = '{
  "initialFen": "7k/8/8/8/8/8/7K/R7 w - - 0 1",
  "sideToMove": "white",
  "userSide": "white",
  "moves": [
    {
      "id": 1,
      "correctMove": "Ra7",
      "description": "White restricts the king to the last rank.",
      "acceptedMoves": ["Ra7"],
      "computerMove": "Kg8"
    },
    {
      "id": 2,
      "correctMove": "Kg2",
      "description": "White brings the king into play.",
      "acceptedMoves": ["Kg2"],
      "computerMove": "Kf8"
    },
    {
      "id": 3,
      "correctMove": "Kf3",
      "description": "The white king continues approaching.",
      "acceptedMoves": ["Kf3"],
      "computerMove": "Ke8"
    },
    {
      "id": 4,
      "correctMove": "Ke4",
      "description": "Approaching...",
      "acceptedMoves": ["Ke4"],
      "computerMove": "Kd8"
    },
    {
      "id": 5,
      "correctMove": "Kd5",
      "description": "Approaching...",
      "acceptedMoves": ["Kd5"],
      "computerMove": "Kc8"
    },
    {
      "id": 6,
      "correctMove": "Kd6",
      "description": "Approaching...",
      "acceptedMoves": ["Kd6"],
      "computerMove": "Kb8"
    },
    {
      "id": 7,
      "correctMove": "Rc7",
      "description": "Confining the king further.",
      "acceptedMoves": ["Rc7"],
      "computerMove": "Ka8"
    },
    {
      "id": 8,
      "correctMove": "Kc6",
      "description": "Approaching...",
      "acceptedMoves": ["Kc6"],
      "computerMove": "Kb8"
    },
    {
      "id": 9,
      "correctMove": "Kb6",
      "description": "Opposition.",
      "acceptedMoves": ["Kb6"],
      "computerMove": "Ka8"
    },
    {
      "id": 10,
      "correctMove": "Rc8#",
      "description": "Checkmate.",
      "acceptedMoves": ["Rc8", "Rc8#"],
      "computerMove": null
    }
  ],
  "hint": "Use the rook to restrict the enemy king to the edge, then bring your own king forward for the final mate."
}'::jsonb
WHERE type = 'exercise';


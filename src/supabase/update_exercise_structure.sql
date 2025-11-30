WITH target_lesson AS (
  SELECT id FROM lessons WHERE slug = 'simple-mates-rook' LIMIT 1
)
UPDATE lesson_contents
SET content = '{
  "initialFen": "7k/8/8/8/8/8/7K/R7 w - - 0 1",
  "sideToMove": "white",
  "userSide": "white",
  "instructions": "Deliver checkmate with the Rook.",
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
      "description": "Forcing the king to the corner.",
      "acceptedMoves": ["Rc7"],
      "computerMove": "Ka8"
    },
    {
      "id": 8,
      "correctMove": "Kc6",
      "description": "Almost there...",
      "acceptedMoves": ["Kc6"],
      "computerMove": "Kb8"
    },
    {
      "id": 9,
      "correctMove": "Kb6",
      "description": "Prepare for mate.",
      "acceptedMoves": ["Kb6"],
      "computerMove": "Ka8"
    },
    {
      "id": 10,
      "correctMove": "Rc8#",
      "description": "Final checkmate.",
      "acceptedMoves": ["Rc8", "Rc8#"],
      "computerMove": null
    }
  ]
}'::jsonb
WHERE lesson_id = (SELECT id FROM target_lesson) AND type = 'exercise';


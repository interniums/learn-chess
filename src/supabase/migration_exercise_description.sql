alter type content_type add value if not exists 'exercise';

-- We are adding a 'description' field to the exercise JSON structure.
-- The schema doesn't enforce this, but we will document it.
-- {
--   "instructions": "...",
--   "fen": "...",
--   "solution": ["move1", "move2"],
--   "hint": "...",
--   "description": "Optional text to show below instructions but above board, e.g. context about the position"
-- }

COMMENT ON COLUMN lesson_contents.content IS 'JSON structure. For exercise: { instructions, fen, solution, hint, description, explanation }';


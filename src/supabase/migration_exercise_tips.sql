alter type content_type add value if not exists 'exercise';

alter table lesson_contents
drop constraint if exists lesson_contents_content_check;

-- We can't easily validate jsonb schema in Postgres without extensions, 
-- but we can document the expected structure for 'exercise':
-- {
--   "instructions": "...",
--   "fen": "...",
--   "solution": ["move1", "move2"],
--   "hint": "Try moving your rook...",
--   "explanation": "This works because..."
-- }

-- No schema changes needed for 'completed' field on the content itself
-- because completion is tracked per USER in `user_progress`. 
-- However, for an individual exercise within a lesson, we need to track its state in the UI.

-- If you meant persistent progress for EACH exercise:
-- We currently track progress at the LESSON level (user_progress table).
-- To track individual exercises, we might need a new table or expand the JSON in user_progress.

-- OPTION A: Simple (Current) - Track Lesson Completion only.
-- OPTION B: Detailed - Track each exercise.

-- Let's stick to the current schema for DB, but update the JSON content to include 'hint'.
-- The "progress bar" and "is completed" state are usually client-side state 
-- while the user is doing the lesson, unless you want to save partial lesson progress?

-- Assuming you want to save partial progress (e.g. user did 2/5 steps in a lesson):
-- We already have `last_position` in `user_progress` table! 
-- This stores the index of the last content they were viewing.
-- So if they are on step 3 (Exercise), we know they finished 1 and 2.

-- So, we just need to update the JSON content structure to support tips.
-- I will just add a comment here as the schema doesn't strictly enforce the JSON keys.

COMMENT ON COLUMN lesson_contents.content IS 'JSON structure. For exercise: { instructions, fen, solution, hint, explanation }';


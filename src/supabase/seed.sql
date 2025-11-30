-- 1. Create the Book
INSERT INTO books (slug, title, description, cover_image)
VALUES (
  'chess-fundamentals',
  '{"en": "Chess Fundamentals"}', 
  '{"en": "The classic guide by World Champion José Raúl Capablanca."}',
  '/images/wellcome/capablanca-ai.webp'
);

-- 2. Create a Section (Chapter 1)
WITH new_book AS (
  SELECT id FROM books WHERE slug = 'chess-fundamentals' LIMIT 1
),
new_section AS (
  INSERT INTO sections (book_id, slug, "order", title, description)
  SELECT 
    id, 
    'first-principles', 
    1, 
    '{"en": "First Principles: Endings, Middlegame and Openings"}', 
    '{"en": "We start with endgames to understand the value of pieces.\\nThen we move to the middlegame and finally the openings."}'
  FROM new_book
  RETURNING id
),
-- 3. Create a Lesson (Simple Mates)
new_lesson AS (
  INSERT INTO lessons (section_id, slug, "order", title, description)
  SELECT 
    id, 
    'simple-mates', 
    1, 
    '{"en": "Simple Mates"}', 
    '{"en": "How to checkmate with heavy pieces."}'
  FROM new_section
  RETURNING id
)
-- 4. Insert Content for the Lesson (Mixed Types with Hint)
INSERT INTO lesson_contents (lesson_id, "order", type, content)
SELECT 
  id, 
  1, 
  'text', 
  '{"text": "The first thing a student should do, is to familiarize himself with the power of the pieces. This can best be done by learning how to accomplish quickly some of the simple mates."}'::jsonb
FROM new_lesson
UNION ALL
SELECT 
  id, 
  2, 
  'text',
  '{"text": "In the ending of Rook and King against King, the principle is to drive the opposing King to the last line of any side of the board."}'::jsonb
FROM new_lesson
UNION ALL
SELECT 
  id, 
  3, 
  'exercise', 
  '{
    "instructions": "Deliver checkmate with the Rook.",
    "fen": "8/8/8/8/8/4k3/4p3/4K1R1 w - - 0 1",
    "solution": ["Rg3#"],
    "hint": "Look for a check that also covers the escape squares. The King is trapped on the back rank."
  }'::jsonb
FROM new_lesson
UNION ALL
SELECT 
  id, 
  4, 
  'text',
  '{"text": "Notice how the Rook cuts off the King from the rest of the board. This is a key concept in all rook endgames."}'::jsonb
FROM new_lesson;

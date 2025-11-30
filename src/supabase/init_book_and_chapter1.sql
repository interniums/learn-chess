-- 1. Create the Book "Chess Fundamentals"
INSERT INTO books (slug, title, description, cover_image)
VALUES (
  'chess-fundamentals',
  '{"en": "Chess Fundamentals"}', 
  '{"en": "The classic guide by World Champion José Raúl Capablanca."}',
  '/images/wellcome/capablanca-ai.webp'
)
ON CONFLICT (slug) DO NOTHING; -- Avoid duplicate error if re-running

-- 2. Create Chapter 1: "First Principles: Endings, Middlegame and Openings"
WITH target_book AS (
  SELECT id FROM books WHERE slug = 'chess-fundamentals' LIMIT 1
)
INSERT INTO sections (book_id, slug, "order", title, description)
SELECT 
  id, 
  'first-principles', 
  1, 
  '{"en": "First Principles: Endings, Middlegame and Openings"}',
FROM target_book
ON CONFLICT (book_id, slug) DO NOTHING;


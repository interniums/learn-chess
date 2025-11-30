WITH parent_section AS (
  SELECT id FROM sections WHERE slug = 'first-principles' LIMIT 1
),
new_lesson AS (
  INSERT INTO lessons (section_id, slug, "order", title, description)
  SELECT id,
         'simple-mates-rook', -- Changed slug slightly to avoid unique constraint if 'simple-mates' exists
         2, -- Changed order to 2
         '{"en": "Simple Mates"}',
         '{"en": "Learning the basic procedure for delivering elementary checkmates with a Rook."}'
  FROM parent_section
  RETURNING id
)
INSERT INTO lesson_contents (lesson_id, "order", type, content)
-- 1. Intro text
SELECT id, 1, 'text'::content_type,
       '{
          "text": "The first thing a student should do, is to familiarize himself with the power of the pieces. This can best be done by learning how to accomplish quickly some of the simple mates."
        }'::jsonb
FROM new_lesson
UNION ALL
-- 2. Exercise with FULL description
SELECT id, 2, 'exercise'::content_type,
       '{
          "instructions": "White to move. Demonstrate the basic King and Rook vs King mating procedure from this position.",
          "description": "In this position the power of the Rook is demonstrated by the first move, which immediately confines the Black King to the last rank, and the mate is quickly accomplished.\\n\\nThe combined action of King and Rook is needed to arrive at a position in which mate can be forced. The general principle for a beginner to follow is to keep his King as much as possible on the same rank, or, as in this case, file, as the opposing King. When, in this case, the King has been brought to the sixth rank, it is better to place it, not on the same file, but on the one next to it towards the center.\\n\\nOn move 5 Black could have played 5...Ke8 and, according to principle, White would have continued 6.Kd6 Kf8 (the Black King will ultimately be forced to move in front of the White King and be mated by Ra8) 7.Ke6 Kg8 8.Kf6 Kh8 9.Kg6 Kg8 10.Ra8#.\\n\\nNot 6.Kc6 because then the Black King will go back to Kd8 and it will take much longer to mate.\\n\\nIf now the King moves back to 6...Kd8 7.Ra8# mates at once.\\n\\nIt has taken exactly ten moves to mate from the original position.",
          "fen": "7k/8/8/8/8/8/7K/R7 w - - 0 1",
          "solution": [
            "Ra7", "Kg8",
            "Kg2", "Kf8",
            "Kf3", "Ke8",
            "Ke4", "Kd8",
            "Kd5", "Kc8",
            "Kd6", "Kb8",
            "Rc7", "Ka8",
            "Kc6", "Kb8",
            "Kb6", "Ka8",
            "Rc8#"
          ],
          "hint": "Use the rook to restrict the enemy king to the edge, then bring your own king forward for the final mate."
        }'::jsonb
FROM new_lesson
UNION ALL
-- 3. Closing text
SELECT id, 3, 'text'::content_type,
       '{
          "text": "In the ending of Rook and King against King, the principle is to drive the opposing King to the last line of any side of the board."
        }'::jsonb
FROM new_lesson;


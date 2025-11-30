WITH target_lesson AS (
  SELECT id FROM lessons WHERE slug = 'simple-mates-rook' LIMIT 1
)
UPDATE lesson_contents
SET content = jsonb_set(
  content,
  '{description}',
  '[
    "In this position the power of the Rook is demonstrated by the first move, which immediately confines the Black King to the last rank, and the mate is quickly accomplished.",
    "The combined action of King and Rook is needed to arrive at a position in which mate can be forced. The general principle for a beginner to follow is to keep his King as much as possible on the same rank, or, as in this case, file, as the opposing King. When, in this case, the King has been brought to the sixth rank, it is better to place it, not on the same file, but on the one next to it towards the center.",
    "White continues to improve the king`s position.",
    "The black king is forced back.",
    "White brings the king closer.",
    "Almost there...",
    "On move 5 Black could have played 5...Ke8 and, according to principle, White would have continued 6.Kd6 Kf8 (the Black King will ultimately be forced to move in front of the White King and be mated by Ra8) 7.Ke6 Kg8 8.Kf6 Kh8 9.Kg6 Kg8 10.Ra8#.\\n\\nNot 6.Kc6 because then the Black King will go back to Kd8 and it will take much longer to mate.",
    "If now the King moves back to 6...Kd8 7.Ra8# mates at once.",
    "Forcing the king to the corner.",
    "Prepare for mate.",
    "Checkmate! It has taken exactly ten moves to mate from the original position."
  ]'::jsonb
)
WHERE lesson_id = (SELECT id FROM target_lesson) AND type = 'exercise';


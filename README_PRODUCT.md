# Interactive “Chess Fundamentals” Learning Site — README (Product + UX Plan)

You can make this far more engaging than a “book-to-web” transcription by treating Capablanca as your **spine** (curriculum) and wrapping it with **interaction loops** (practice → feedback → review → mastery).

> Note on rights: *Chess Fundamentals* is widely available as public domain in the US (e.g., Project Gutenberg). Still, double-check the **specific edition/translation** you use in your jurisdiction.  
> Sources: Project Gutenberg listing; Wikimedia Commons copyright notes. 

---

## 1) Product Goal

Build a guided, chapter-by-chapter learning experience based on *Chess Fundamentals* that:
- teaches core chess concepts progressively,
- feels interactive and game-like,
- remains beautiful and calm (reading-app vibe) rather than noisy gamification,
- allows expansion beyond the book content.

---

## 2) Content Model: Turn Chapters into “Learning Loops”

Instead of “chapter pages,” structure **Lessons** with a consistent rhythm:

### Lesson Template (recommended)
1. **Idea in 30 seconds**  
   1–2 tight paragraphs + 1 diagram position.
2. **Show it (interactive)**  
   User plays the key move on a board.
3. **Guided practice set**  
   3–7 exercises that ramp difficulty.
4. **Common mistakes**  
   2–3 wrong-but-natural move tries with short refutations.
5. **Mini-checkpoint**  
   A quiz + 1 “solve from memory” position.
6. **Review queue**  
   Schedule hardest positions for later repeats.

This makes learning feel like: **read a bit → do a bit → get feedback → level up**.

---

## 3) App Progress Structure: “Campaign + Gym”

### A) Campaign (guided path)
- **Chapter → Lessons → Checkpoint test**
- Unlock next chapter after either:
  - passing checkpoint, or
  - reaching “good enough” mastery (e.g., 80% accuracy on exercises).

### B) Gym (free practice modes)
- **Tactics trainer** (tagged by motif + difficulty)
- **Endgame drills** (Capablanca basics shine here)
- **Play vs bots** with constraints (e.g., “win this K+P endgame”)
- **Review** (spaced practice for mistakes)

Pattern references:
- Chess.com lessons (guided structure)   
- Lichess puzzles/studies (practice-first ecosystem)   

---

## 4) The “Killer Feature”: Interactive Book Commentary Layers

Capablanca is clear, but modern learners need **why** + **feedback**.

Add layers on top of the original text:
- **Expandable definitions** (opposition, zugzwang, outpost…)
- **Alternative line toggles** (“If Black plays …, you respond …”)
- **Engine-backed sanity checks** shown gently:
  - “Your move works, but this is simpler”
  - “This loses because of this tactic” (show a 2-move refutation)
- **Explain-my-move** interaction:
  - user selects intent (“win material / activate king / stop pawn”)
  - compare to the lesson’s target concept

---

## 5) Retention & Stickiness Features (without clutter)

### Learning and retention
- **Spaced repetition** for positions/patterns (especially endgames & tactics).  
  Inspiration: Chessable’s review model. 
- **Mistake journal**:
  - “You often miss forks”
  - “You push pawns too early”
  - “You trade into lost pawn endings”
  → suggest drills based on recurring errors.
- **Adaptive difficulty**:
  - 3 correct in a row → slightly sharper positions
  - repeated failures → simpler stepping-stone positions

### Motivation (light-touch)
- **Streaks only for reviews** (healthier habit loop)
- **Badges tied to real skill**:
  - “Mate with Q+K under 10 moves”
  - “Lucena mastered”
  - “Win K+P vs K consistently”
- **Shareable recap cards** (“Completed Endgames 2/7”)

### Social (optional)
- **Weekly challenges**
- **User-created studies/mini-lessons** like Lichess studies 

---

## 6) UX / UI Recommendation

### Best single-lesson layout
- **Left column:** Text + key points + step navigation (“Step 3/8”)
- **Right column:** Interactive board + move list + hint button
- **Bottom (collapsible):** “Why this works” + “Common mistakes”

### Visual style
- Calm “reading app” foundation + crisp “game UI” clarity:
  - large typography, generous spacing
  - one accent color for actions (“Solve”, “Hint”, “Next”)
  - progress bar at top, minimal noise

### Micro-interactions to get right
- Correct move → subtle animation + short explanation
- Wrong move → gentle “Try again” + hint ladder (no shame)
- Always allow “Show solution,” but record it for mastery scoring

---

## 7) References / Inspiration (to borrow patterns)

- **Chess.com Lessons** (guided learning flow)   
- **Lichess** (practice modes + studies ecosystem)   
- **Chessable** (spaced repetition + structured review)   
- Bonus: community “Chess Fundamentals” studies exist on Lichess you can inspect for content chunking ideas. 

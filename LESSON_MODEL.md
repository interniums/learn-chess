# Lesson Content Model

This document describes the current lesson structure, how it is represented in the database, and how the frontend renders it. It also includes prompt guidelines for using ChatGPT to generate lesson content.

## High-level lesson structure

Every lesson is designed as a linear sequence of "steps" that the learner moves through:

1. **Title** (from `lessons.title`)
2. **Why it matters** (intro section)
3. **Subjects / main concepts** (1 or more sections)
4. **Funny / interesting fact** (optional section)
5. **Illustrative image(s)** (optional, per section)
6. **Exercise(s)**
   - Target (what to achieve)
   - Prerequisites & rules
   - Description
   - Step-by-step checklist
   - Common mistake + explanation
   - Optionally marked as "no help" for harder exercises
7. **Simple quiz / recap** (can be represented as a section with questions)
8. **Harder final exercise** (exercise with `no_help = true`)
9. **Optional famous game fragments** (represented as sections and/or exercises)

On the frontend, all of these are rendered as a combination of:

- `text` steps (for explanations, intros, fun facts, quiz text, etc.)
- `image` steps (for diagrams / illustrations)
- `exercise` steps (interactive chess board with a goal)

The step ordering is determined by a numeric `order` field computed in `getLessonContents`.

## Database schema

### `lessons`

Core metadata for each lesson.

Important columns:

- `id uuid PRIMARY KEY`
- `slug text UNIQUE` – e.g. `simple-mates`
- `title text` – displayed in the header
- `short_description text`
- `difficulty text` – e.g. `beginner`
- `estimated_minutes int`
- `section_id uuid` – FK to `sections(id)` (used for routing)

### `lesson_sections`

Used for all non-board content: intros, subjects, fun facts, quiz text, game commentary, summaries, etc.

Proposed/expected columns:

- `id serial PRIMARY KEY`
- `lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE`
- `section_order int NOT NULL` – primary ordering within the lesson
- `section_key varchar(100)` – optional logical key, e.g. `intro`, `subject_1`
- `title varchar(255) NOT NULL`
- `body_markdown text NOT NULL` – main text content (supports `\n` for paragraphs)
- `kind text` – optional classification, e.g. `intro`, `subject`, `fun_fact`, `quiz`, `game`, `summary`
- `image_url text` – optional image to display after this section
- `image_alt text` – optional caption/alt text

Migration snippet:

```sql
ALTER TABLE lesson_sections
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_alt text;
```

### `lesson_exercises`

Holds structured metadata for each exercise in a lesson.

Columns (existing + extended):

- `id serial PRIMARY KEY`
- `lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE`
- `exercise_order int NOT NULL`
- `type varchar(50) NOT NULL` – e.g. `tactics`
- `prompt_markdown text NOT NULL` – base prompt text to show the learner
- `solution_markdown text NOT NULL` – analysis / solution (not yet shown in UI, but stored)
- `difficulty varchar(50) NOT NULL` – `easy`, `medium`, `hard`
- **New metadata fields:**
  - `target text` – what the learner should achieve (e.g. "Mate with rook and king")
  - `prerequisites text` – what they should know before this exercise
  - `rules text` – any constraints (e.g. "White to move and mate in 2 moves or less")
  - `checklist_markdown text` – step-by-step list of how to achieve the target
  - `common_mistake_markdown text` – description of a typical mistake and why it is bad
  - `no_help boolean DEFAULT false` – if true, hint text is suppressed (for the harder, no-help exercise at the end)

Migration snippet:

```sql
ALTER TABLE lesson_exercises
  ADD COLUMN IF NOT EXISTS target text,
  ADD COLUMN IF NOT EXISTS prerequisites text,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS checklist_markdown text,
  ADD COLUMN IF NOT EXISTS common_mistake_markdown text,
  ADD COLUMN IF NOT EXISTS no_help boolean DEFAULT false;
```

### `lesson_positions`

Board position and tactical data for each exercise.

- `id serial PRIMARY KEY`
- `lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE`
- `exercise_id int REFERENCES lesson_exercises(id) ON DELETE CASCADE`
- `fen varchar(255) NOT NULL` – starting position
- `side_to_move varchar(5) NOT NULL` – `white` or `black`
- `correct_move varchar(20) NOT NULL` – e.g. `Qh7#`
- `explanation text NOT NULL` – why the move works / mating idea

## Frontend mapping (getLessonContents)

### Source code: `src/lib/api.ts`

`getLessonContents(lessonId)` is the single place that:

1. Queries `lesson_sections`, `lesson_exercises`, `lesson_positions`.
2. Builds a combined, ordered array of `LessonContent` steps for `LessonViewer`.

Rough flow:

1. **Sections**
   - Query `lesson_sections` with `section_order`.
   - For each section `s`:
     - Push a `text` step with `content.text = s.body_markdown`.
     - If `s.image_url` is set, push an `image` step immediately after with `content.src = s.image_url` and `caption = s.image_alt || s.title`.

2. **Exercises**
   - Query `lesson_exercises` for the lesson.
   - Join with `lesson_positions` by `exercise_id` to get `fen`, `side_to_move`, `correct_move`, `explanation`.
   - Build a `GoalExerciseConfig` from `target` and position data.
   - Combine `prompt_markdown`, `prerequisites`, `rules`, and `checklist_markdown` into a single `instructions` string.
   - Use `common_mistake_markdown` and/or `lesson_positions.explanation` as the `hint`, unless `no_help = true` (then `hint = null`).
   - Return these as `type: 'exercise'` steps.

3. Sort all steps by `order` and return them.

The `LessonViewer` doesn’t know about sections vs exercises vs fun facts – it just receives a list of `LessonContent` items:

- `type: 'text'` → rendered as paragraphs.
- `type: 'image'` → rendered as an image.
- `type: 'exercise'` → rendered as an interactive board with goals and hints.

## How to structure a lesson conceptually

For a typical lesson like **"Simple Mates"**, you might use sections and exercises like this:

1. **Intro section** (`lesson_sections.kind = 'intro'`)
   - Title: "Why Simple Mates Matter"
   - Body: short explanation of why finishing games is important.

2. **Subject sections** (`kind = 'subject'`)
   - Subject 1: "Rook + King vs King: The Core Plan"
   - Subject 2: "Using the Rook as a Wall"
   - Subject 3: "Bringing the King Closer"

3. **Fun fact section** (`kind = 'fun_fact'`)
   - Interesting story or anecdote related to rook mates or a famous game.

4. **Image(s)**
   - For any of the above sections, you can attach `image_url` / `image_alt`. The frontend will render a separate image step right after the related text.

5. **Exercises** (`lesson_exercises` + `lesson_positions`)
   - Several exercises that are configured with:
     - `target`: e.g. "Mate with rook and king against a lone king."
     - `prerequisites`: e.g. "Know how the rook and king move."
     - `rules`: e.g. "White to move. Mate in as few moves as possible."
     - `checklist_markdown`: numbered steps (1., 2., 3.) outlining the plan.
     - `common_mistake_markdown`: text describing the typical error.
     - `no_help`: `false` for normal exercises, `true` for a hard, no-help final exercise.

6. **Quiz**
   - Represented as a section with `kind = 'quiz'` and `body_markdown` containing short Q&A or multiple-choice in markdown.
   - The UI will show it as text; you can evolve it later into a dedicated quiz component if desired.

7. **Famous games**
   - One or more sections with `kind = 'game'` with commentary and maybe PGN snippets in `body_markdown`.
   - For interactive "find the move" moments, you can additionally create exercises pointing to key FENs from that game.

## ChatGPT prompt guidelines for content creation

### 1. Lesson-level metadata prompt

Use a prompt like this to create or refine lesson metadata:

> You are designing a chess lesson for a beginner-friendly course. The lesson slug is `simple-mates`. Produce:
> - A short title
> - A 1–2 sentence short_description explaining why this lesson matters
> - An estimated_minutes value (integer)
> - A difficulty label (`beginner`, `intermediate`, or `advanced`).

This information is used to fill the `lessons` table.

### 2. Section content prompt (intro, subjects, fun facts, quiz, summary)

Prompt template:

> You are writing lesson sections for a chess lesson with slug `simple-mates`.
> For each section I give you (intro, subjects, fun fact, quiz, summary), return:
> - `kind`: one of `intro`, `subject`, `fun_fact`, `quiz`, `summary`, `game`.
> - `title`: a short heading.
> - `body_markdown`: well-structured markdown using paragraphs and bullet lists. Do not include frontmatter.
> - Optionally: `image_prompt`: a short English description of an illustrative image for this section.
>
> Ensure the intro explains why the topic matters, each subject section focuses on one core idea, the fun fact is memorable, and the quiz section includes 3–5 short questions.

You can then convert this JSON-like output into `lesson_sections` inserts, mapping `image_prompt` to generated `image_url` (if you later integrate an image generator).

### 3. Exercise creation prompt (with image + description)

Prompt template for each exercise:

> You are creating a structured chess exercise for the lesson `simple-mates`.
> I will give you:
> - An image of the position (board) and/or a FEN.
> - A short description of the theme (e.g. "back-rank mate", "rook + king vs king").
>
> From this, return a JSON object with:
> - `target`: what the learner should achieve.
> - `prerequisites`: brief text of what they should already know.
> - `rules`: constraints like "White to move and mate in 2 or fewer moves".
> - `prompt_markdown`: the main learner-facing prompt, including FEN in backticks.
> - `checklist_markdown`: a numbered checklist of how to achieve the goal.
> - `common_mistake_markdown`: explanation of a typical mistake and why it fails.
> - `difficulty`: `easy`, `medium`, or `hard`.
> - `no_help`: boolean, `true` if this should be the final, no-help exercise.
> - `position`: `{ fen, side_to_move, correct_move, explanation }`.
>
> Make sure `explanation` describes the core mating idea in 1–3 sentences.

You can then map this into `lesson_exercises` + `lesson_positions` rows.

### 4. Famous game fragment prompt

Prompt template:

> You are adding a famous game fragment to illustrate the theme of `simple-mates`.
> Suggest one famous game or plausible instructive fragment that shows a simple mating pattern.
> Return:
> - `title`: short heading like "Capablanca demonstrates rook and king vs king".
> - `body_markdown`: a short story of the position, why it matters, and the key moment.
> - Optionally, a FEN and `correct_move` if you want to turn the key moment into an exercise as well.

Store the narrative as a `lesson_sections` row with `kind = 'game'` and, if needed, add a matching `lesson_exercises` + `lesson_positions` entry for the interactive "find the move" step.

---

This model is intentionally flexible:

- The **database** carries enough structure to express your richer lesson design.
- The **frontend** currently maps everything into `text`, `image`, and `exercise` steps that are already supported.
- You can incrementally make the UI more specialized (e.g. separate quiz UI) without breaking the content format or existing lessons.

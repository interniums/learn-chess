# Development Goals & Checklist

This file tracks high-level goals and implementation ideas for the Learn Chess project.

## 1. Lesson Content Improvements

- [ ] Add images into text-only lesson pages
  - [ ] Extend `lesson_contents` data for existing lessons with `type: "image"` entries (use `content.src` and optional `content.caption`).
  - [ ] Verify `LessonViewer` image rendering and styling for mixed text+image flows.
- [ ] Add additional exercises of the same type (exercise libraries)
  - [ ] Decide on data model: more `lesson_contents` of `type: "exercise"` per lesson vs. separate `exercises` table.
  - [ ] Seed multiple exercises per theme (e.g. multiple "simple mates" positions).
  - [ ] Update lesson UX if needed (index of exercises, quick navigation between them).

## 2. Exercise Modes (Free vs Restricted)

- [ ] Design exercise metadata to support two modes:
  - [ ] `mode: "restricted"` (only best / accepted moves allowed) — current behavior.
  - [ ] `mode: "free"` (any legal move allowed, more exploratory).
- [ ] Extend exercise JSON schema in `lesson_contents.content` (or related table) to include `mode`.
- [ ] Thread `mode` through:
  - [ ] `LessonViewer` → `ChessBoardComponent` props.
  - [ ] `ChessBoardComponent` move validation logic (skip strict SAN checking in free mode, adjust feedback).

## 3. Profile, Settings, and Progress

- [ ] Add profile page route (e.g. `src/app/[locale]/profile/page.tsx`)
  - [ ] Create `ProfilePage` client component under `src/pages/profile/`.
  - [ ] Display basic user info from Supabase `users` table.
- [ ] Progress overview
  - [ ] Add new API helpers in `src/lib/api.ts` to aggregate `user_progress` (lessons started/completed, last played lesson, etc.).
  - [ ] Render progress summary and per-lesson status on the profile.
- [ ] Board settings integration
  - [ ] Option A: expose current `BoardSettings` (from `BoardSettingsContext`) as a UI-only section in the profile.
  - [ ] Option B (future): add `user_settings` table in Supabase to persist board settings server-side and sync across devices.

## 4. Main Screen with Sections and Lessons

- [ ] Implement a proper main learning screen (academy dashboard)
  - [ ] Decide route: evolve `/[locale]/wellcome` or add `/[locale]/academy`.
  - [ ] Add API helper(s) in `src/lib/api.ts` to fetch `sections` with their `lessons` (including ordering and slugs).
  - [ ] (Optional) Join user progress to show status per lesson (not started / in progress / completed).
- [ ] UI/UX
  - [ ] Section cards with title, description, and progress.
  - [ ] Lesson lists inside each section with direct navigation.

## 5. Training Types (Endgames, Middlegame, Traps, Openings, etc.)

- [ ] Extend data model
  - [ ] Add a `type` or `training_category` field to `sections` (or a related table) to classify content (endgames, middlegame, openings, traps, etc.).
- [ ] Filtering & navigation
  - [ ] On the main screen, allow filtering or jumping to training type (e.g. "Endgames", "Openings").
  - [ ] Optionally expose these types as top-level tabs or quick links.

## 6. Donations

- [ ] Choose donation mechanism
  - [ ] External service (Patreon, Ko-fi, etc.) **or** Stripe checkout/payment links.
- [ ] Implement donation entry points
  - [ ] Add a Donate button in header/footer/profile.
  - [ ] If using Stripe or similar, add a minimal server route/handler to redirect to a configured checkout/session.

## 7. Full Book Import (Chess Fundamentals)

- [ ] Define canonical JSON or data format for the entire book
  - [ ] Map chapter/section/lesson structure to existing `books`, `sections`, `lessons`, and `lesson_contents` tables.
- [ ] Write an import script
  - [ ] Node script (or SQL generator) that reads the book JSON and creates/updates rows via Supabase client or SQL files.
  - [ ] Place the script under `src/supabase/` or `scripts/` and document how to run it.
- [ ] Populate production/dev database
  - [ ] Test import in a dev environment.
  - [ ] Verify random lessons render correctly (text, images, exercises).

---

Feel free to update this file as goals change, marking completed items with `[x]` and adding more detail or links to related PRs/commits as features are implemented.

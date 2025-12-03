# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- **Install dependencies**
  - `npm install`
- **Run development server (Next.js App Router on port 8080)**
  - `npm run dev`
- **Build for production**
  - `npm run build`
- **Start production server (after `npm run build`)**
  - `npm start`
- **Run linting (Next.js + TypeScript via flat ESLint config)**
  - `npm run lint`
- **Notes about tests**
  - There is currently no `test` script or test framework configured in `package.json`, so there is no standard command for running a single test yet.

### Environment and external services

- The app uses **Supabase** from both server and browser contexts.
  - Required env vars (used in `src/supabase/server.ts` and `src/supabase/client.ts`):
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Internationalization is handled by **next-intl** and expects locale message files under `messages/` (e.g. `messages/en.json`).

## High-level architecture

### Framework and routing

- The project is a **Next.js 15 App Router** app with TypeScript, located primarily under `src/`.
- Routing is locale-aware:
  - Top-level app entry is `src/app/[locale]/layout.tsx` and `src/app/[locale]/page.tsx`.
  - Auth and content routes are nested under the `[locale]` segment:
    - Auth server pages: `src/app/[locale]/(auth)/sign-in/page.tsx`, `src/app/[locale]/(auth)/sign-up/page.tsx`.
    - Welcome / landing: `src/app/[locale]/wellcome/page.tsx`.
    - Lesson shell routes:
      - Section-level: `src/app/[locale]/[section]/page.tsx`.
      - Lesson-level: `src/app/[locale]/[section]/[...lesson]/page.tsx`.
- `src/pages/**` holds **client-side page components** that implement the actual UI for these routes (e.g. `LessonPage`, `WellcomePage`, auth pages). The App Router route files are thin server components that fetch data, then render these page components.

### Internationalization and middleware

- **Routing and navigation** for i18n is defined in `src/i18n/routing.ts` using `next-intl`'s `defineRouting` and `createNavigation` helpers.
  - Only the `en` locale is currently configured.
  - Navigation hooks and components (`Link`, `useRouter`, etc.) are re-exported from this module and used throughout the app.
- **Request-time locale resolution and message loading** lives in `src/i18n/request.ts`, which:
  - Validates the incoming `requestLocale` against configured locales.
  - Loads the corresponding translation JSON from `messages/{locale}.json`.
- Global **middleware** (`middleware.ts` at repo root) composes:
  - `next-intl` middleware for locale handling.
  - Supabase session handling via `src/supabase/middleware.ts`.
  - Simple auth protection:
    - Public routes are defined in `EXCLUDED_ROUTES` (`/sign-in`, `/sign-up`, `/wellcome`).
    - For other routes under a locale prefix (e.g. `/en/...`), unauthenticated users are redirected to `/en/sign-in`.

### Supabase integration and data layer

- **Server client**: `src/supabase/server.ts`
  - Provides `createClient()` which wraps `@supabase/ssr`'s `createServerClient` and wires it to Next.js `cookies()` for auth/session.
- **Middleware client**: `src/supabase/middleware.ts`
  - Exposes `updateSession(request, response)` used by the root `middleware.ts` to:
    - Create a Supabase client for the incoming request.
    - Sync Supabase auth cookies between request and response.
    - Return `{ response, supabase, user }` to the middleware pipeline.
- **Browser client**: `src/supabase/client.ts`
  - Provides `createClient()` for client-side components using `createBrowserClient` with the same env vars.
- **Data access layer**: `src/lib/api.ts`
  - Central place for all lesson-related queries, all using the server Supabase client and memoized via `react`'s `cache`:
    - `getLessonBySlug(sectionSlug, lessonSlug)` fetches lesson metadata by section + slug.
    - `getLessonContents(lessonId)` loads ordered `lesson_contents` rows for a lesson.
    - `getUserProgress(lessonId)` returns the current user's `user_progress` row for that lesson.
    - `getFirstLesson()` determines the first playable lesson by walking `books -> sections -> lessons` with ordering.
    - `getLastPlayedLesson()` determines the most recently played lesson for the signed-in user based on `user_progress.updated_at` and joins back to `lessons` and `sections` for slugs.
- **Server actions for mutations** are located under `src/actions/`:
  - `src/actions/progress.ts`:
    - `updateProgressAction(lessonId, currentStepIndex)` upserts `user_progress` and tracks `last_position`.
    - `completeLessonAction(lessonId)` marks a lesson as completed (with `completed_at`) and calls `revalidatePath('/')`.
  - `src/actions/auth/auth.ts`:
    - `createAccountAction` wraps Supabase email/password signup and upserts into a `users` table.
    - `loginAction` performs email/password login and ensures a matching `users` row.
    - `anonymousLoginAction` uses `supabase.auth.signInAnonymously()`.
  - `src/actions/user/user.ts`:
    - `getLastVisitedLesson()` returns the last visited lesson path from the `users` table, falling back to a hard-coded path (`/first-principles/simple-mates`).
- SQL files under `src/supabase/*.sql` define and evolve the database schema and seed data used by the app (books, sections, lessons, lesson_contents, etc.).

### Layout, global providers, and UI

- The **root layout** `src/app/[locale]/layout.tsx`:
  - Imports global CSS (`src/app/globals.css`).
  - Registers Google fonts via Next.js `next/font`.
  - Wraps the app tree with:
    - `NextIntlClientProvider` for i18n messages.
    - `BoardSettingsProvider` for chess board configuration (see below).
    - `ToastContainer` from `react-toastify` for global notifications.
- **Board settings context** (`src/contexts/BoardSettingsContext.tsx`):
  - Stores per-user chess board preferences in `localStorage` under the `boardSettings` key.
  - Exposes `useBoardSettings()` to read and update settings:
    - `pieceSpeed` (animation speed), `showLegalMoves`, `showConfetti`, `playSounds`.
- **UI primitives** (buttons, dialog, inputs, form layout, etc.) live under `src/components/ui/` and are used across pages and feature components.

### Lesson and exercise flow

- **Lesson route**: `src/app/[locale]/[section]/[...lesson]/page.tsx`
  - Server component that:
    - Reads `locale`, `section`, and `lesson` from params.
    - Uses `getLessonBySlug` and `getLessonContents` to fetch lesson metadata and ordered contents.
    - Uses `getUserProgress` to compute `initialIndex` from `last_position`.
    - Normalizes the raw `content` payload to `Record<string, unknown>` for the client.
    - Renders `LessonPage` with `{ contents, lessonTitle, lessonId, initialIndex }`.
- **Client lesson view**: `src/pages/lesson/LessonPage.tsx`
  - Client component responsible for:
    - Rendering a fixed header with the lesson title and a back button (using `useRouter` from i18n routing to go back to `/wellcome`).
    - Rendering `LessonViewer` with:
      - `onStepChange` wired to `updateProgressAction` to persist current step.
      - `onComplete` wired to `completeLessonAction` and then redirecting to `/wellcome` on success.
- **Lesson content renderer**: `src/components/lesson/LessonViewer.tsx`
  - Receives `contents` as an ordered array of blocks, each of type `text`, `image`, or `exercise`.
  - Manages the current index and renders the appropriate UI:
    - `text`: paragraph splitting and rendering with typography styles.
    - `image`: responsive `next/image` with optional overlay caption.
    - `exercise`: renders `ChessBoardComponent` configured for the exercise.
  - Exposes navigation via Previous/Next/Complete buttons and shows a step counter at the bottom of the viewport.

### Chess exercise engine

- **Domain types**: `src/types/chess.ts`
  - Defines `ExerciseStep`, `ExerciseData`, `MoveStatus`, `SavedProgress`, etc., shared by utilities, hooks, and UI components.
- **Chess utilities**: `src/utils/chess.ts`
  - Encapsulates visual and geometric logic specific to the chessboard:
    - `getCheckHighlights(game)` and `getArrowCoords(game, moveNotation)` compute styles/coordinates for check, checkmate, and hint arrows.
    - `getLegalMovesForSquare(game, square)` and `createLegalMoveHighlights(squares)` return Lichess-style legal move highlights.
    - `createMoveHighlights(from, to)` highlights from/to squares for the last move.
- **Sound utilities**: `src/utils/sounds.ts`
  - Exposes `playSound(type, volume?)` for chess move sounds (move, capture, check, checkmate) backed by audio files in `public/sounds/`.
- **Stateful hooks**:
  - `src/hooks/useChessGame.ts`:
    - Centralizes the game state using `chess.js` and localStorage-backed persistence.
    - Tracks game FEN history, view mode, completion state, and move status.
    - Persists progress per exercise to `localStorage` using a key like `exercise-progress-{exerciseId}`.
    - Provides imperative helpers: `resetGame`, `undoMove`, `redoMove`, `completeExercise`, plus setters/getters for view mode and move status.
  - `src/hooks/useBoardInteraction.ts`:
    - Keeps UI interaction state separate from game rules.
    - Manages selected squares, highlight styles, drag state, and visibility of the move arrow.
    - Uses chess utilities to compute highlights and call `createMoveHighlights` on interactions.
- **Board settings UI**: `src/components/lesson/BoardSettingsPanel.tsx`
  - Connects UI controls to `useBoardSettings` so users can adjust the exercise board (e.g. animations, sound, legal move hints).
- **Exercise UI components** (all under `src/components/lesson/` and summarized in `REFACTORING_SUMMARY.md`):
  - `ChessBoardComponent.tsx` (refactored, memoized main component): orchestrates `useChessGame`, `useBoardInteraction`, and visual components.
    - Handles both drag-and-drop (`onPieceDrag`, `onPieceDrop`) and click-to-move (`onSquareClick`).
    - Validates moves against `ExerciseStep.correctMove` / `acceptedMoves` and optionally applies a `computerMove` reply.
    - Plays sounds and triggers confetti on completion, respecting board settings.
    - Manages visual feedback (correct/incorrect) through move status.
  - `MoveFeedback.tsx`: overlays check/X indicators and completion messaging on top of the board.
  - `HintPanel.tsx`: renders descriptive text, optional hint, and controls for toggling text hints and revealing the correct move arrow.
  - `HintArrow.tsx`: SVG overlay component drawing the move hint arrow using coordinates from `getArrowCoords`.
  - `ExerciseControls.tsx`: provides Restart/Undo/Redo controls wired to the game and interaction hooks.

### Welcome experience and roadmap

- **Welcome route**: `src/app/[locale]/wellcome/page.tsx`
  - Server component that:
    - Creates a Supabase client.
    - Checks for an authenticated user and, if available, loads the last played lesson via `getLastPlayedLesson()`.
    - Falls back to `getFirstLesson()` when there is no prior progress.
    - Computes a `firstLessonPath` string like `/{sectionSlug}/{lessonSlug}` (with a final hard-coded fallback) and passes it to `WellcomePage`.
- **Client welcome page**: `src/pages/wellcome/WellcomePage.tsx`
  - Renders the primary marketing/landing content for the app (hero image, summary, roadmap section).
  - Integrates `GetStartedModal` and uses `useSearchParams` + `useRouter` (i18n-aware) to control modal visibility and navigation.
  - Decides whether to open the auth modal or redirect directly to the first lesson based on whether `user` is authenticated.
- **Roadmap section**: `src/components/wellcome/Roadmap.tsx` + `src/shared/constants/roadmap.ts`
  - `ROADMAP` constant defines the learning path/items (title, description, images, like/dislike counts).
  - `Roadmap` component renders each roadmap item with images, copy, and a `Link` into the first-principles lesson path.

### Auth pages

- The sign-in and sign-up routes under `src/app/[locale]/(auth)/` are thin server components that:
  - Compute the first lesson path via `getFirstLesson()`.
  - Render client-side auth pages `SignInPage` / `SignUpPage` from `src/pages/(auth)/...`, passing `firstLessonPath` so the auth flows know where to redirect on success.

### Additional notes

- `REFACTORING_SUMMARY.md` documents the rationale behind the chess-related refactor, including where logic was extracted (utils, hooks, types, components) and the benefits for maintainability and performance. When modifying the chess exercise experience, consult that file to keep new changes consistent with the refactored architecture.
- The top-level `README.md` is intentionally minimal; the core usage and architectural details for this project are captured here in `WARP.md` and in the Supabase SQL files under `src/supabase/`.

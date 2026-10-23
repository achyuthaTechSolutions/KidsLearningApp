# Work log

## 2026-10-22: Story Time (Panchatantra-inspired stories)

**Baseline:**

- The branch was clean and restarted from `main` (`f9c2e0f`).
- There were no `CLAUDE.md`, `.ai/` files, or coding-constitution files. The only repository rule is `.cursor/rules/child-friendly-voice.mdc`, which this work follows: the English soft voice is unchanged, and parent settings are respected.

**Changed files:**

- **Added:** `src/features/stories/**`, `docs/STORIES.md`, and these `.ai/*.md` files.
- **Edited:**
  - Story settings and storage, and reset on Reset All Progress: `src/types/index.ts`, `src/services/storage.ts`, `src/store/useAppStore.ts`.
  - Language-aware voices with a text-only fallback: `src/services/speech.ts`.
  - Routes, menu entry, and home card: `src/App.tsx`, `src/app/sections.ts`, `src/features/home/HomePage.tsx`.
  - Story language setting and lazy-loaded story summary: `src/features/parent-settings/ParentSettings.tsx`.
  - Data disclosure: `src/features/privacy/PrivacyPage.tsx`, `docs/PRIVACY_POLICY_DRAFT.md`.
  - Indic fonts: `src/main.tsx`, `src/theme/tokens.ts`.
  - Reaction keyframes: `src/index.css`.
  - `README.md`.
  - Pictures: `src/assets/illustrations/*` (regenerated).
- **Dependencies:** `@fontsource/noto-sans-telugu` and `@fontsource/noto-sans-devanagari` 5.3.0.

**Problems found and fixed during the work:**

- A story with a picture missing from the bundle was hidden by the publishing gate, as designed. A development-only console warning now explains why.
- Telugu rendered unshaped on a machine with no Indic fonts. Fixed by bundling the Noto fonts.
- Bar-graph bars were drawn at different scales while being built. Fixed with one shared plot area.
- Parent Settings pulled all story content into the main bundle. Fixed by lazy-loading the summary.
- Validation caught the Monkey story claiming a "prediction" objective it never practised. The claim was removed.

**Checks run (actual results):**

- `npx tsc -b`: passes.
- `npm test`: 35 files, 247 tests pass. Before this work: 32 files, 212 tests.
- `npm run lint`: 2 warnings, both pre-existing (`KeyboardExplorer.tsx`).
- `npm run build`: succeeds.
- Scratch Playwright on `vite preview`, not committed:
  - **All five stories, played through the interface** at 1280 and 390 px. Each finished with 1 completion and 5, 4, 4, 5, and 3 learning events, matching the activities. No console errors and no overflow. The story screen was interactive in 0.42–0.93 s in this container's headless Chromium. This is not a device measurement.
  - **Thirsty Crow walkthrough:**
    - a hint after a wrong answer, and "Show me" after two misses;
    - Kalu drinks after 4 pebbles;
    - a reload resumes on the same line;
    - switching to Telugu or Hindi keeps the place;
    - the moral is shown at the end;
    - 5 events are recorded, with the first two correctly marked not clean.

**Not done:**

- native-speaker review;
- recorded narration;
- final artwork;
- a committed end-to-end suite;
- checks on a real Android device and with a screen reader;
- a React Native app (none exists).

## 2026-10-23: Story Time release readiness

**Baseline:**

- Branch `claude/learning-games-photo-puzzle` at `95de500`, equal to the remote and clean, 1 commit ahead of `main` (`f9c2e0f`).
- `tsc` passed; 35 files and 247 tests passed; lint had 2 pre-existing warnings; the build succeeded.

**Added:**

- **Browser tests**
  - Playwright and axe: `playwright.config.ts`, `e2e/helpers.ts`, `e2e/story-time.spec.ts`, `e2e/accessibility.spec.ts`.
  - `npm run test:e2e`. Vitest now excludes `e2e/`.
- **Text and asset checks**
  - `src/features/stories/content/inventory.ts`, `localization.test.ts`, `assetManifest.ts`, `assets.test.ts`, and `src/features/stories/assets.ts`.
- **Docs**
  - `docs/localization/` (checklist, review sheet, status);
  - `docs/stories/ASSETS.md` and `asset-manifest.csv`;
  - `docs/stories/BACKEND_INTEGRATION.md`;
  - `docs/qa/ANDROID_STORY_TIME_QA.md`.

**Problems found and fixed:**

- axe contrast failures:
  - the library language and age pickers, white on orange at 3.4:1;
  - the bar-graph category buttons and bar counts, white on orange and green at about 3.4:1.
- Five screen-reader labels were English-only in Telugu and Hindi mode. They are now localized, as drafts.
- `vite.config.ts` gave a new lint warning after adding the import. The redundant triple-slash reference was removed.

**False alarms, explained rather than hidden:**

- axe flagged contrast while content was mid-fade. Scans now run under reduced motion.
- The number check flagged the Hindi "3-3". It now understands that form.
- My first font test checked weight 400, which the caption does not use. The test was corrected; the app did not change.

**Checks (actual):**

- `tsc` passes.
- 37 files and 258 tests pass.
- Lint: 2 pre-existing warnings.
- The build succeeds.
- E2E: 28 of 28 pass across both profiles.

**Not done:**

- native-speaker review;
- recordings;
- final art;
- real-device and TalkBack testing (no SDK or device here);
- a server.

Nothing was pushed or merged.

## 2026-10-23: Integration readiness

**Verified at start:**

- On `claude/learning-games-photo-puzzle` at `404132a`, in sync with the remote, clean.
- 4 commits ahead of `main` (`f9c2e0f`); `main` had not moved.
- No CI workflows exist.
- All checks passed before any change:
  - tsc;
  - 258 unit tests;
  - lint, with 2 old warnings;
  - build;
  - 28 E2E tests.

**Expo branches:**

- Checked out `cursor/mobile-auth-onboarding-8089` as a detached worktree in the session scratchpad. The working tree here was not touched.
- `npm ci`, `npx tsc --noEmit`, and Jest passed (10 suites, 29 tests).
- The branch has no common ancestor with `main`.
- Its `packages/learning-core` alphabet, numbers, and animals files are byte-identical to `main`'s `src/data`.
- Its speech filters to English voices only.

**Added:**

- `engine/stages.ts` and its tests. The library filter switched to stages (unit and E2E tests updated from "7–9" to "7–8").
- `engine/sync.ts` and its tests.
- `newRunId` in `engine/player.ts`.
- `engine/portable.test.ts`.
- Docs:
  - `docs/architecture/MOBILE_ARCHITECTURE.md`;
  - `docs/stories/AGE_STAGES.md`;
  - `docs/stories/SYNC.md`;
  - `docs/qa/RELEASE_VERIFICATION.md`.
- Updated `BACKEND_INTEGRATION.md`, `ASSETS.md`, `ANDROID_STORY_TIME_QA.md`, and `STORIES.md`.
- Pinned `@playwright/test` to exactly 1.56.1. The lockfile entry was already 1.56.1.

**Corrected:**

- The QA doc still said "no React Native code exists".

**Review findings:**

- No secrets or temporary files are tracked.
- The generated docs reproduce exactly with snapshot updates switched off (`CI=true`).

**Checks (final, actual):**

- tsc passes.
- 40 files and 274 tests pass.
- Lint: 2 pre-existing warnings.
- The build succeeds.
- E2E: 28 of 28 pass.

**Not done, and needs a person:** see `docs/qa/RELEASE_VERIFICATION.md`.

Nothing was pushed, merged, or opened as a PR in this pass.

## 2026-10-23: Number Racer

The owner asked for a car racing game in the games section.

**Built:** Number Racer (`/games/racer`, id `racer`, Move and Play category). A learning racer:

- steer into the lane whose gate holds the right answer;
- Beginner asks to find or count up to 5, Explorer adds and takes away within 10, and Champion works within 20 and adds missing numbers;
- no crashes and no game over: a miss shows the answer, repeats the question more slowly, and makes the right gate glow after two misses;
- the car is a top-down SVG in 4 colours, because the emoji car is a side view.

**Files:**

- `features/number-racer/{engine.ts, engine.test.ts, NumberRacer.tsx}`;
- the catalog entry, the lazy route in `App.tsx`, and the `kl-road` keyframes;
- the racing-car illustration.

**Found and fixed: the illustration script.**

- `npm run illustrations` deleted 45 bundled pictures still used by `packages/learning-core` (moved there by PR #2), because it scanned only `src/`.
- Restored them from git.
- The script now also scans `packages/`, skipping `node_modules`. A rerun writes all 222 pictures and deletes none.

**Phone layout fixes from screenshots:**

- The road height scales with the screen.
- The counting sign is one line.
- The road and steer buttons scroll above the bottom menu.
- The car sits higher, so it is not clipped.

**Tests:**

- 10 engine tests.
- 3 E2E tests on a fake clock, on desktop and phone:
  - a full 5-gate race recorded as `gameLevels.racer = ['beginner-5']`;
  - two misses keep the question, and the right gate glows;
  - arrow and number keys steer, and Pause holds the gate.
- My first E2E timing was wrong (fixed jumps overshot the 1.6–2.6 s feedback). The tests now advance in small steps.

**Checks:**

- tsc passes.
- 41 files and 285 tests pass.
- Lint: 2 pre-existing warnings.
- The build succeeds (NumberRacer chunk 12.7 kB).
- E2E: 34 of 34 pass.
- The GitHub Pages build (`GITHUB_PAGES=true npm run build`) also succeeds.

This entry is on branch `claude/number-racer`, from `main` at `2824b3e`, with Number Racer only.

**Not done:** no achievement badge for the racer, and no real-device check.

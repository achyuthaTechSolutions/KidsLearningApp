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

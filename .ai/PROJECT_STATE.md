# Project state

Last updated: 2026-10-23 (integration readiness pass). Branch `claude/learning-games-photo-puzzle`, 4 commits ahead of `main` (`f9c2e0f`) and pushed up to `404132a`. This pass adds one more local commit, which is not pushed. No PR exists, and nothing is merged.

## The product

Kids Learning is a local-first React 19, Vite 8, MUI 9, and Zustand 5 app with a Capacitor 8 Android shell. It has:

- no backend, accounts, subscriptions, analytics, or ads;
- all data in `localStorage`, mirrored to Capacitor Preferences on Android;
- device speech synthesis for narration;
- Vitest and Testing Library for unit tests;
- Playwright with axe (`npm run test:e2e`) for browser tests, on desktop Chrome and a Pixel 7 profile.

## Story Time (this change)

| Area | Status |
| --- | --- |
| Typed content model, player state machine, validation, progress (`src/features/stories/engine`) | Implemented; unit tests pass |
| Five stories: Thirsty Crow, Clever Rabbit, Lion and Mouse, Monkey and Crocodile, Cooperative Doves | Implemented; validated; every branch tested to the end; played in Chromium |
| Activities: pebble pot, count, arithmetic, number line, equal groups, pattern, sequence, bar graph, question; branching choices | Implemented; tests pass; played in Chromium |
| Library (`/stories`): filters, continue card, offline note; player (`/stories/:id`): captions, replay, read-to-me, resume | Implemented and browser-checked at 1280 px and 390 px |
| English, Telugu, Hindi: text, interface, language switch, story language setting | Implemented, with automated text checks, a generated review sheet, and a checklist (`docs/localization/`). **Telugu and Hindi are drafts. No native-speaker review has taken place.** |
| Narration | Uses a recorded file, then the device voice, then text only. The recordings are found by file name (`src/features/stories/assets.ts`), and the recording spec is in `docs/stories/ASSETS.md`. **No recorded narration exists. The recording path has never played a real file.** |
| Bundled Noto Telugu and Devanagari fonts | Added |
| Artwork | Development artwork: code-drawn backdrops and Fluent Emoji characters. Replacement art is found by id, and a provenance check runs. The asset manifest is `docs/stories/asset-manifest.csv`. **No final illustrations yet.** |
| Parent summary (Parent Settings → Learning summary) | Implemented |
| Accounts, entitlements, server sync | None in this app. Design only: `docs/stories/BACKEND_INTEGRATION.md`. No endpoint exists. |
| Android device QA, TalkBack | Checklist in `docs/qa/ANDROID_STORY_TIME_QA.md`. **Not run:** there is no Android SDK or device here. |
| React Native app | Not on `main`. The Expo app on `cursor/mobile-app-export-8089` and `cursor/mobile-auth-onboarding-8089` shares no history with `main`. On the auth branch, `tsc` passes and Jest passes (29 tests). It has no Story Time. Assessment: `docs/architecture/MOBILE_ARCHITECTURE.md`. |
| Age groups | One model: learning stages `3-4`, `5-6`, `7-8`, the same as the Expo `AgeBand` (`engine/stages.ts`, `docs/stories/AGE_STAGES.md`). No stored data needed migrating. |
| Sync | Specification in `docs/stories/SYNC.md`. The rules are tested in `engine/sync.ts`, which the app does not use yet. Run ids are now collision-resistant. |
| Human verification | Register in `docs/qa/RELEASE_VERIFICATION.md`. All 14 items are still open. |

Details: `docs/STORIES.md`. The earlier games are described in `docs/GAMES.md`.

## Checks (last run 2026-10-23, on the final code)

| Command | Result |
| --- | --- |
| `npx tsc -b` | passes |
| `npm test` | 40 files, 274 tests pass |
| `npm run lint` | 2 warnings, both pre-existing in `KeyboardExplorer.tsx` (also on `main`) |
| `npm run build` | succeeds; main `App` chunk 327.6 kB |
| `npm run test:e2e` (with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`) | 28 pass: 14 tests × desktop and Pixel 7 profiles |
| CI | none: the repository has no `.github/workflows` |

## Next actionable step

1. The product owner decides which app is the store product (Capacitor or Expo). That decides where Story Time ships, and where reviewers and device QA should spend their time.
2. A native Telugu speaker and a native Hindi speaker review the text (`docs/localization/REVIEW_CHECKLIST.md`).
3. Run the Android device and TalkBack checklist on real phones.

## Known gaps

- No native-speaker review. No recorded narration. No final artwork.
- Not checked on a real Android device or with a screen reader.
- The orange and green PillPickers in Puzzle Planet and Letter Tracing probably have the same contrast issue that was fixed in Story Time. Those screens were not scanned or changed.
- `src/services/storage.ts` depends on the stories feature (a layering issue to fix before adding sync).
- Storage writes fail silently when storage is full (`safeSet`). Fix this before sync.
- The repository has no CI, so tests run only when someone runs them.
- Ages 9 and over have no learning stage (product decision).
- `npm run android:bundle` calls `gradlew.bat`, so it only works on Windows.

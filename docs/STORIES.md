# Story Time

Story Time (`/stories`) is a set of interactive picture-book stories with maths, comprehension, and morals, in English, Telugu, and Hindi. It runs fully on the device, like the rest of the app.

## What is built

| Story | Tradition | Ages | Activities |
| --- | --- | --- | --- |
| Kalu and the Thirsty Crow | Aesop’s “The Crow and the Pitcher”, widely retold in India | 3–6 | reach question, pebble pot with prediction, counting, comparing, cause and effect |
| The Clever Rabbit and the Lion | Panchatantra, Book 1 | 4–7 | addition, a branching choice, story sequencing, prediction (reflection), counting |
| The Lion and the Mouse | Aesop, widely retold in India | 4–7 | describing words, a rope pattern, equal groups (3 × 2), comprehension |
| The Monkey and the Crocodile | Panchatantra, Book 4 | 5–8 | subtraction, number line, a branching choice, distance reasoning, sequencing, a trust question |
| The Doves Who Worked Together | Panchatantra, Book 2 | 5–9 | interactive bar graph (most, fewest, difference), a branching choice, equal groups (4 × 3), comprehension |

**Ages.** The library filters by learning stage: *Ages 3–4*, *5–6*, or *7–8*. These are the same bands as the parent-account child profiles. A story shows for every stage its age range overlaps. See `docs/stories/AGE_STAGES.md`.

All text is original, written for this app in 2026. The traditional tales are public domain. No modern translation or illustration was copied. Each story records its tradition and provenance in its manifest.

## How it fits together

All the story logic is plain TypeScript with no React or DOM imports, so a future React Native app can reuse it unchanged.

```
src/features/stories/
  engine/          Plain TypeScript, no React or DOM imports
    types.ts       Content model: StoryManifest, Scene, Line, Activity (discriminated union), Localized text
    activities.ts  Every answer: water level, pebbles needed, sums, number line, groups, patterns, graph answers; attempts, hints, demos
    player.ts      Playback state machine: next-line, solve, choose, continue, replay-scene, restart; safe resume
    progress.ts    Playback records, learning events, objective summary (practising, succeeding, mastered)
    validate.ts    Content validation
  content/         The five stories, characters, library (publishing gate), interface text
  activities/      React screens for each activity kind, plus the shared frame and the attempt hook
  player/          Story player, stage (backdrops and characters), narration hook
  StoryLibrary.tsx, StoryProgressSummary.tsx
```

The routes are `/stories` and `/stories/:storyId`. Both are lazy-loaded, so story content is not in the first download.

### Rules the engine keeps

- **Answers come from the data.** Answers are computed in `activities.ts` from each activity's data. A screen only draws those values. The pot's water, the bar heights, and the number-line target never come from what is drawn.
- **Hints and demonstrations.** A hint appears after one miss, and "Show me" after two. Once an activity is solved, further taps are ignored, so it completes once.
- **Only valid moves.** The player changes position only through `playerReducer`, and actions that do not fit the current phase are ignored. A saved position from another content `version`, or one pointing at a missing scene, restarts the story instead of breaking it.
- **Counted once.** Completion is counted once per play-through (`runId`), and each activity is recorded once per run.
- **Mastery takes repeated evidence.** It needs three clean answers (first try, with no hint or demonstration) across at least two different activities. Finishing a story is never counted as mastery.

### Validation and publishing

`validateStory()` reports these as errors:

- missing fields, provenance, or objectives;
- a missing Telugu, Hindi, or English string;
- unknown characters or backdrops, and missing bundled pictures or narration files;
- bad or unreachable scene references, or a story with no reachable ending or no moral;
- an unsupported activity type, or invalid activity numbers (an answer missing from the choices, a tie for "most" on a graph, a pattern shown fewer than twice, and so on);
- a bad version number.

`publishedStories()` hides any story with an error. In development it also prints the reason to the console. Tests require every story to pass with no errors and no warnings, and to reach its moral along every branch.

### Adding a story

1. Add a manifest in `content/`, following `thirstyCrow.ts`. Use an existing activity kind, or add a new kind in all of these places: `types.ts`, `activities.ts`, `validate.ts`, an activity screen, and `ActivityView`.
2. Add it to `allStories` in `content/library.ts`.
3. Run `npm run illustrations` if it uses new emoji, then `npm test`.

## Languages

`en`, `te`, and `hi` are built into the model. Every `Localized` string needs all three, and validation fails otherwise. The language setting (`storyLanguage`) is kept with the other parent settings and can also be switched in the player. Switching language keeps the child's place, because progress is stored per story, not per language.

**Translation status.** English is the source. **The Telugu and Hindi text are draft translations written for this app. They have not been reviewed by native speakers.** Each manifest records this as `draft-needs-native-review`, and Parent Settings says so. Review them before release.

**Review materials** are in `docs/localization/`:

- `REVIEW_CHECKLIST.md`: how to review and sign off.
- `story-review-sheet.csv`: every string, with verdict columns.
- `REVIEW_STATUS.md`: status per story and language.

The sheet and status page are generated from the story data (`content/inventory.ts`), and `npm test` fails if they fall out of date. The same tests check every string for:

- missing text;
- `{slots}` and numbers that differ from English (Telugu and Devanagari digits included);
- the wrong script;
- leftover English words.

**Fonts.** Fredoka and Nunito do not include Telugu or Devanagari. The app bundles Noto Sans Telugu and Noto Sans Devanagari (SIL OFL 1.1) as script-only subsets, so the text shapes correctly on every device, including ones without system Indic fonts. The browser only downloads them when that script is on screen.

## Narration and audio

The app has no recorded narration yet.

**Order of preference.** Each line, activity question, and moral is narrated with the first of these that is available:

1. a recorded file (`src/features/stories/assets.ts`);
2. the device voice for the language;
3. text only.

**Where recordings go.** A recording is found by file name at `src/assets/stories/narration/<lang>/<review-sheet key>.mp3`. A line can also name a file in `Line.audio`, and validation fails if a named file is not bundled. So adding narration needs no code or story change. The full contract and recording specification are in `docs/stories/ASSETS.md`.

Until files exist:

- **English:** uses the existing soft device voice, following `.cursor/rules/child-friendly-voice.mdc`.
- **Telugu and Hindi:** use a device voice for that language when one is installed. When none is, the story never reads the text with an English voice. It shows a note and continues with the words on screen.
- **Respects settings:** narration follows Speech, Volume, Speed, and Voice in Parent Settings, plus the player's own Voice switch.
- **Stops cleanly:** narration stops when the app is hidden, the language changes, or the player closes.
- **Read to me:** this mode reads and turns pages until an activity or choice.

If a recording fails to play, the device voice takes over.

The player code for recordings is built and unit-tested through the registry. **It has never played a real file**, because none exists.

## Artwork

Development artwork, not final:

- **Backdrops:** the picture-book scenes (dry field, forest, well, river, jamun tree, meadow, sky) and their border are drawn in code (`player/Stage.tsx`), so they never contain text or answers.
- **Characters and props:** bundled Fluent Emoji pictures (MIT).
- **Reactions:** character reactions (idle, speaking, thinking, happy, surprised, sad, action) are short CSS animations, which stop under reduced motion.

To use final art, add `src/assets/stories/art/character.<id>.webp` or `backdrop.<id>.webp` and record its provenance. `Stage.tsx` then uses it instead of the development art. The story data does not change.

`docs/stories/asset-manifest.csv` lists every art and narration slot, with:

- its story and scene;
- the asset id;
- the format;
- its status;
- its provenance.

It is generated and checked by `content/assets.test.ts`. See `docs/stories/ASSETS.md`.

## Progress, accounts, and subscriptions

**This app has no accounts, sign-in, backend, or subscriptions.** Nothing was invented to stand in for them, and all stories are free.

- **Storage:** progress is stored under `kids-learning-stories`, alongside the rest of the app's data. It is mirrored to Android's on-device preferences like the other keys.
- **Damaged data:** damaged records are dropped when loading.
- **Reset:** Reset All Progress clears it.
- **Contract for later:** `StoryRecord` and `LearningEvent` in `engine/progress.ts` are the contract a future sync service would carry. Events are already one per run per activity, so sending them again would be idempotent.
- **Backend design:** `docs/stories/BACKEND_INTEGRATION.md` covers auth, entitlements, parent access, and analytics. It is a design only, and no endpoint exists.
- **Sync specification:** `docs/stories/SYNC.md` covers event identity, acknowledgement and retention, retries, conflicts, versions, the proposed API, and a migration plan.
  - Its client rules are tested in `engine/sync.ts`, which the app does not use yet.
  - New run ids now include a random part (`newRunId`), so two devices cannot produce the same id.

**Offline.** All five stories, their art, and the fonts are bundled, so Story Time works offline with nothing to download.

**Parent summary.** Parent Settings → Learning summary → Story Time shows stories started and finished, plus each skill as practising, succeeding, or mastered, with skills that might need more practice. It never measures speed.

## Mobile

The Android app on `main` is the Capacitor shell, which runs this same React code. It is not React Native.

**Correction (2026-10-23).** An earlier note said no React Native code existed in the account. That was wrong. The unmerged branches `cursor/mobile-app-export-8089` and `cursor/mobile-auth-onboarding-8089` replace this project with a standalone Expo (React Native 0.88) app. The second also adds parent sign-in, but it has no server.

`cursor/native-mobile-app-8089` added an Expo app and then removed it again, keeping `packages/learning-core`. None of these branches is on `main`, and none of them contains Story Time.

The `engine/` folder and the story files are DOM-free, and `engine/portable.test.ts` keeps them that way. The screens (`activities/`, `player/`) use MUI and the DOM, and would need native versions.

`docs/architecture/MOBILE_ARCHITECTURE.md` compares the two apps and explains how they could share story definitions, accounts, and onboarding.

Device QA and the accessibility review are in `docs/qa/ANDROID_STORY_TIME_QA.md`.

## Testing

- `engine/engine.test.ts`: pot model, attempts and hints, the player state machine, resume and versioning, progress and mastery, and validation of broken stories.
- `engine/stages.test.ts`, `engine/sync.test.ts`, `engine/portable.test.ts`: learning stages (boundaries, unknown ages, legacy values), sync identity, merge and retention rules, and a guard that the shareable domain has no platform imports.
- `content/content.test.ts`: all five stories validate with no warnings, every branch reaches the moral, every activity type is used, numbers match in every language, graph and pattern answers, scripts are correct per language, and every interface string exists in all three languages.
- `stories.ui.test.tsx`:
  - the library, language switching, and the age filter;
  - resume after closing, the missing-voice fallback, and hiding captions;
  - recording a question, the pebble pot (hint, "Show me", and one completion);
  - building and answering the bar graph.

- `content/localization.test.ts` and `content/assets.test.ts`: text checks, the asset registry, provenance, and the generated review sheet and asset manifest.
- **Browser tests:** `npm run test:e2e` (Playwright) runs `e2e/*.spec.ts` against the production build, on desktop Chrome and a Pixel 7 profile. It covers:
  - selecting a story;
  - a full run with hints and "Show me";
  - completion and learning events;
  - resume;
  - switching language mid-activity;
  - both branches;
  - the bar graph;
  - Indic fonts;
  - the no-voice fallback;
  - axe WCAG 2.1 AA scans;
  - keyboard-only play;
  - reduced motion.

  In this container, run it with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`.

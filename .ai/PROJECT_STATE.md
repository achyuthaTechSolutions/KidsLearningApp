# Project state

Last updated: 2026-10-22. Branch `claude/learning-games-photo-puzzle`, restarted from `main` at `f9c2e0f` after PR #3 merged.

## The product

Kids Learning is a local-first React 19, Vite 8, MUI 9, and Zustand 5 app with a Capacitor 8 Android shell. It has:

- no backend, accounts, subscriptions, analytics, or ads;
- all data in `localStorage`, mirrored to Capacitor Preferences on Android;
- device speech synthesis for narration;
- Vitest and Testing Library for tests, with no end-to-end framework committed.

## Story Time (this change)

| Area | Status |
| --- | --- |
| Typed content model, player state machine, validation, progress (`src/features/stories/engine`) | Implemented; unit tests pass |
| Five stories: Thirsty Crow, Clever Rabbit, Lion and Mouse, Monkey and Crocodile, Cooperative Doves | Implemented; validated; every branch tested to the end; played in Chromium |
| Activities: pebble pot, count, arithmetic, number line, equal groups, pattern, sequence, bar graph, question; branching choices | Implemented; tests pass; played in Chromium |
| Library (`/stories`): filters, continue card, offline note; player (`/stories/:id`): captions, replay, read-to-me, resume | Implemented and browser-checked at 1280 px and 390 px |
| English, Telugu, Hindi: text, interface, language switch, story language setting | Implemented. **Telugu and Hindi are drafts that need native-speaker review.** |
| Narration | Device voice per language, with a text-only fallback. **No recorded narration exists yet.** |
| Bundled Noto Telugu and Devanagari fonts | Added |
| Artwork | Development artwork: code-drawn backdrops and Fluent Emoji characters. **No final illustrations yet.** |
| Parent summary (Parent Settings → Learning summary) | Implemented |
| Accounts, entitlements, server sync | **Not applicable:** this app has none, so nothing was invented. Local progress is complete. |
| React Native app | **Does not exist** in this repository or in the account's repositories. The engine is DOM-free and ready to share. |

Details: `docs/STORIES.md`. The earlier games are described in `docs/GAMES.md`.

## Checks (last run, on the final code)

| Command | Result |
| --- | --- |
| `npx tsc -b` | passes |
| `npm test` | 35 files, 247 tests pass |
| `npm run lint` | 2 warnings, both pre-existing in `KeyboardExplorer.tsx` |
| `npm run build` | succeeds; main `App` chunk 327.6 kB (365 kB before this work), story screens lazy-loaded |
| Scratch Playwright (not committed) on `vite preview` at 1280 and 390 px | all 5 stories finish through the interface, completion recorded once each, no console errors, no horizontal overflow; story screen interactive in 0.42–0.93 s (headless Chromium in this container) |

## Next actionable step

Have native speakers review the Telugu and Hindi story text and interface strings in `src/features/stories/content/`. Then set `translation` to `native-reviewed` for each story they approve.

## Known gaps

- No recorded narration. Device voices for Telugu and Hindi are not installed on every device.
- No final illustrations or character animation assets, such as Rive or Lottie files.
- No end-to-end framework in the repository. Consider committing a Playwright suite based on the scratch script.
- Not yet checked on a real Android phone or tablet, or with a screen reader.

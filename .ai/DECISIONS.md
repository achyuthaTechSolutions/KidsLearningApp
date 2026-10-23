# Decisions

## 2026-10-22: Story Time

1. **No backend, accounts, or entitlements were added.** The app has none, and its privacy promise is that nothing leaves the device. Story progress uses the existing storage layer (`kids-learning-stories`, mirrored on Android). `StoryRecord` and `LearningEvent` are shaped so a future sync service could carry them without changes. No endpoint was invented.
2. **No React Native work.** There is no React Native repository. The Android app is a Capacitor shell running the web code. The story engine (`src/features/stories/engine`) has no React or DOM imports, so it can be shared later.
3. **Own lightweight localization instead of an i18n library.** `Localized = Record<'en' | 'te' | 'hi', string>` sits in the content model, and validation fails on any missing language. This is enough for three languages and costs no dependency. Revisit if plural rules or many more languages are needed.
4. **The story is data, and the player is a pure reducer.** The `playerReducer` phases are line, activity, choice, continue, and end. Actions that don't fit the current phase are ignored, so double taps and stale timers cannot corrupt the position.
5. **Answers live only in `engine/activities.ts`.** Screens draw values they receive and never compute answers. The bar graph shares one plot area and scale, after a browser check found bars drawn at different scales.
6. **Mastery needs evidence.** It takes 3 clean answers (first try, no hint or demonstration) across at least 2 activities. Story completion never counts as mastery.
7. **Narration uses the device voice per language, with a text-only fallback.** Telugu and Hindi are never read with an English voice. Recorded narration hooks exist in the model, and validation blocks references to files that are not bundled.
8. **Fonts: bundled Noto Sans Telugu and Noto Sans Devanagari (OFL).** A device without Indic fonts rendered Telugu unshaped. The app already bundles its fonts, so it now bundles these too, as script subsets only.
9. **Artwork: backdrops drawn in code, with emoji characters as development art.** There is no licensed illustration set yet. Replacing art is by id, with no change to the story data. No Rive, Lottie, or Reanimated: nothing in the project needed them yet.
10. **Branching choices converge.** The "wrong" choice teaches why, then rejoins the main path, so no child is stuck or shamed.
11. **Content honesty.**
    - The Thirsty Crow and the Lion and the Mouse are labelled as Aesop fables widely retold in India, not as Panchatantra stories.
    - Telugu and Hindi are labelled `draft-needs-native-review`.
    - The Monkey story's trust lesson is about what a character does, not what kind of animal it is.

## 2026-10-23: Story Time release readiness

12. **Browser tests use Playwright with axe**, run against the production build on desktop Chrome and a Pixel 7 profile.
    - The axe scans run with reduced motion. Entrance fades measured mid-animation gave false contrast failures.
    - The tests are type-checked by the normal build.
13. **Generated review artefacts are checked by tests.** The translation review sheet, the status page, and the asset manifest are written by Vitest file snapshots. A story change that is not reflected in them fails `npm test`. Regenerate them with `-u`.
14. **Assets are found by file name, not listed in story data.**
    - Art: `art/character.<id>` and `art/backdrop.<id>`.
    - Narration: `narration/<lang>/<review-sheet key>`.

    This keeps story logic unchanged when assets arrive. `Line.audio` stays as an explicit override and is still validated. Every bundled file needs a provenance entry, or a test fails.
15. **Narration fallback order:** recording, then device voice, then text. A recording that fails to play falls back to the voice.
16. **Number checks allow the Hindi "3-3" form** ("3 each"). It is idiomatic, not a mistranslation.
17. **Screen-reader labels follow the story language.** Before this, five labels were English-only. Their Telugu and Hindi are drafts like the rest.
18. **Correction to decision 2.** The account does have Expo (React Native) code, on the unmerged branches `cursor/mobile-app-export-8089` and `cursor/mobile-auth-onboarding-8089`. The Android app on `main` is still the Capacitor shell, and Story Time was not added to the Expo app. The backend design reuses that branch's parent-account contract shapes rather than inventing a second one.

## 2026-10-23: Integration readiness

19. **One age model: learning stages `3-4`, `5-6`, and `7-8`.** These are the same values as the parent-account `AgeBand` on the Expo auth branch.
    - Stories keep their exact `ageRange`, and suit every stage they overlap.
    - Unknown, out-of-range, and legacy values (`3-5`, `5-7`, `7-9`) mean "no stage, show all". They are never mapped to a guessed stage.
    - The old Story Time filter was never saved, and no app stores a child's age, so nothing needed migrating.
    - The library filter now uses the stages.
    - The asset lookup by file name stays. The Expo app would need a static `require()` map with the same ids.
20. **Sync rules are specified and tested before any server exists.**
    - Event identity is `<runId>/<activityId>`.
    - New run ids carry a random part. Legacy ids get the device's install id appended once, before the first upload.
    - Unacknowledged events and completions are never dropped.
    - Events and completions merge as unions. Resume points go to the newest copy.

    `docs/stories/SYNC.md` supersedes the sync part of `BACKEND_INTEGRATION.md`. Endpoints remain proposals.
21. **Expo branches are not merged here.** They have no common history with `main`, and a merge would replace the website. The recommendation is that the Expo app becomes the long-term store app, in its own repository, with Story Time ported through a shared `story-core` package. This needs the product owner's decision.
22. **`@playwright/test` is pinned exactly to 1.56.1,** to match the override that pins `playwright-core` for `@axe-core/playwright`. A newer test runner would mismatch the `Page` type.

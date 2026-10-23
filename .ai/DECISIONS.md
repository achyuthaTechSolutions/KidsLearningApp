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

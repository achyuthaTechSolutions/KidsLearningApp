# Mobile architecture: Capacitor app and Expo app

Assessed 2026-10-23 from the code on each branch. Nothing was merged, and no app was created.

## What exists

| | Capacitor app (`main` + `claude/learning-games-photo-puzzle`) | Expo app (`cursor/mobile-app-export-8089`, `cursor/mobile-auth-onboarding-8089`) |
| --- | --- | --- |
| What it is | React 19 + Vite web app. The Android build is a Capacitor 8 WebView shell. | React Native 0.88, Expo SDK 58, Expo Router. Native views, no WebView. |
| Name, app id | "Kids Learning", `app.kidslearning.discovery` | "Panchatantra Kids", `app.kidslearning.native`. The two can be installed side by side. |
| Git history | The repository's `main` | **No common ancestor with `main`.** Its root commit replaces the whole project. Its README says it is meant to be its own repository. |
| Checks run here | `tsc`, 258 Vitest tests, lint, build, and 28 Playwright tests pass | Auth branch: `npm ci`, `npx tsc --noEmit`, and Jest (10 suites, 29 tests) pass. No build, `expo lint`, `expo-doctor`, or device run was done. |
| Learning content | `src/data/*` | `packages/learning-core`: a vendored copy. `alphabet`, `numbers`, and `animals` are byte-identical to `main`. |
| Story Time | Five stories, nine activity types, en/te/hi | **None.** The welcome text promises "Stories, maths, and values", but there are no story screens or story data. |
| Accounts | None | Auth branch only. Covered in detail below. |
| Storage | `localStorage`, mirrored to Capacitor Preferences | AsyncStorage for progress, settings, locale, and the onboarding flag. `expo-secure-store` for the session. |
| Languages | Story Time in en/te/hi. The rest of the app is English. | The auth and onboarding screens are in en/te/hi (`src/i18n`), with Noto Telugu and Devanagari fonts. |
| Speech | Web Speech, with a per-language voice and a text-only fallback (Story Time) | `expo-speech`, with **English voices only** (`isEnglishVoice` filter) |
| Age groups | Story `ageRange` in years. The library filter now uses stages `3-4`, `5-6`, `7-8`. | Child profile `ageBand`: `3-4`, `5-6`, `7-8` |

**Expo authentication flow** (auth branch, `src/auth/*`):

1. **Phases:** welcome, then register or log in, then verify (code entry with a resend timer), then choose or add a child, then ready.
   - `decideNavigation` redirects each route group to match the phase.
   - A parent gate protects the grown-ups area.
2. **Contract** (`contract.ts`):
   - `POST /v1/auth/{login,register,forgot,verify,resend,refresh,logout}`, plus `/v1/children` and `/v1/session/child`;
   - a session grant of `{ accessToken, refreshToken, expiresAt, parent }`;
   - a `ChildProfile` of `{ id, nickname, ageBand, avatar }`.
3. **Server and client behaviour:**
   - **No server implements this contract.**
   - `productionClient` needs an `https://` base URL and reports "unavailable" when none is configured.
   - The mock client is available only in development, with `EXPO_PUBLIC_AUTH_MODE=mock`, and keeps everything in memory.

## Which is the intended mobile product

The code alone cannot settle this. **The product owner must decide.**

The evidence points to the **Expo app as the intended store app**:

- it has its own store identity, "Panchatantra Kids", and a separate app id;
- it has parent accounts and child profiles;
- it has native screens;
- its welcome copy describes stories, maths, and values, which is Story Time's subject.

The evidence also shows the **Capacitor app is the only one that currently has Story Time**. It is the one with browser tests, an asset contract, and a QA checklist. It works offline today with no server.

**Recommendation:**

1. Treat the Expo app as the long-term mobile product, and keep the website, with its Capacitor shell, as the web product and the Story Time reference.
2. Do **not** merge either Expo branch into this repository's `main`. They share no history, and a merge would replace the website.
3. Give the Expo app its own repository, as its README already says.
4. Ship Story Time in the Capacitor app first, because it is ready apart from human review. Port it to Expo afterwards, using the shared domain below.

## What can be shared

The **story domain** is already free of platform code. `engine/portable.test.ts` fails if anyone adds a React, DOM, browser, or bundler import to it.

| Shareable unchanged | Path |
| --- | --- |
| Content model, player state machine, activity answers, validation, progress and mastery, learning stages, sync rules | `src/features/stories/engine/*.ts` |
| Story data and characters | `src/features/stories/content/{thirstyCrow,cleverRabbit,lionMouse,monkeyCrocodile,cooperativeDoves,characters}.ts` |
| Interface strings | `content/uiText.ts`. The strings are shareable, but the file imports web font tokens, so split the font out first. |
| Text inventory and review sheet | `content/inventory.ts`. Shareable once `library.ts` (below) no longer pulls in web code. |

| Must stay per app | Why |
| --- | --- |
| Screens: `player/*`, `activities/*`, `StoryLibrary.tsx` | MUI and DOM, against React Native views. They need native rewrites against the same reducer and activity functions. |
| Animation | CSS keyframes and `prefers-reduced-motion`, against Reanimated or RN `Animated` and `AccessibilityInfo.isReduceMotionEnabled` |
| Narration and audio | Web Speech and `HTMLAudioElement`, against `expo-speech` and `expo-audio`. The Expo app also needs Telugu and Hindi voice selection, plus the same text-only fallback. |
| Asset lookup | `assets.ts` and `library.ts` use Vite's `import.meta.glob`. Expo needs a static `require()` map built for the same ids. The ids and the manifest stay the same. |
| Storage and lifecycle | `localStorage` and Capacitor App events, against AsyncStorage and RN `AppState` |
| Fonts | `@fontsource` against `@expo-google-fonts`. Both use Noto Sans Telugu and Noto Sans Devanagari. |

## How both apps can use the same story definitions

1. **Now (no restructuring):**
   - The Expo app already vendors `packages/learning-core` by copying.
   - Do the same with a `packages/story-core` holding the shareable files above.
   - Copy it with a script that also copies their tests, and compare a content hash in both repositories' CI so drift fails the build.
2. **Later:** publish `story-core` as a private npm package, versioned, and have both apps depend on it. Story `version` numbers continue to protect saved positions.
3. **Validation is shared.** Each app supplies its own `ValidationContext` (which pictures and recordings it bundles), so a story with a missing asset is hidden on that platform only.

## Reusing authentication and parent onboarding

- **Use the Expo branch's contract as the single account model** (`contract.ts`): parent-only credentials, verification, child profiles with `ageBand`, and a selected child.
  - Story Time's sync design (`docs/stories/SYNC.md`) and backend design (`BACKEND_INTEGRATION.md`) key everything to that `childId`.
  - The learning stages (`docs/stories/AGE_STAGES.md`) are that contract's `ageBand` values.
- **If the Capacitor app ever needs accounts,** use the same contract and server. Do not build a second account system.
  - It would also need secure token storage: Capacitor Preferences is not secure.
  - It would need `INTERNET` restored in the manifest.
- **Onboarding:** the Expo flow (welcome, then parent account, then verification, then child profile) is where a child's stage is chosen. Story Time should start already filtered to that stage, and keep "All ages" one tap away.

## Open decisions for the product owner

1. Which app is the store product, and whether the Capacitor app ships to the store at all.
2. Whether the Expo app moves to its own repository.
3. Who builds the account and sync server.
4. Whether to add a stage for ages 9 and over.

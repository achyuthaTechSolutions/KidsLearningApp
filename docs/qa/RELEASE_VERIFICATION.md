# Story Time: what still needs a person

Every Story Time requirement that automated checks cannot prove, with its current status.

- **Do not mark an item done** without the evidence named in the right-hand column.
- **As of 2026-10-23,** none of these has happened.

| # | Requirement | Status | Evidence needed | How |
| --- | --- | --- | --- | --- |
| 1 | Telugu text is correct and natural for children | **Not started** | A signed review sheet, and `translation.te` set to `native-reviewed` for each story | `docs/localization/REVIEW_CHECKLIST.md` |
| 2 | Hindi text is correct and natural for children | **Not started** | Same as item 1, for `hi` | Same |
| 3 | Telugu and Hindi render correctly on real devices | **Not started** (only headless Chromium has been checked) | Device QA rows 10 and 19, with screenshots | `docs/qa/ANDROID_STORY_TIME_QA.md` |
| 4 | The Android build installs and runs | **Not started.** No APK has been built: there is no Android SDK in the development container. | A release build installed on two phones and a tablet | Device QA rows 1–2 |
| 5 | Touch play, lifecycle, Back button, rotation, and storage on device | **Not started** | Device QA rows 3–9, 15–17 | Same |
| 6 | Device voices for Telugu and Hindi, and the text fallback, on real phones | **Not started** (the fallback is tested only in headless Chromium, which has no voices) | Device QA rows 11–14 | Same |
| 7 | TalkBack can read and play every story | **Not started** | Device QA rows 20–25 | Same |
| 8 | Performance on a low-end phone | **Not started** | Measured open and advance times (row 18) | Same |
| 9 | Recorded narration plays, stops, and falls back | **Not possible yet:** no recordings exist. The player path has never played a real file. | One real file per language checked on a device | `docs/stories/ASSETS.md` |
| 10 | Final artwork licensed and in place | **Not possible yet:** no final art exists. Development art is Fluent Emoji (MIT) and code-drawn backdrops. | `assetProvenance` entries, plus licences or contracts on file | `docs/stories/ASSETS.md` |
| 11 | Narrator recording releases | **Not possible yet** | Signed releases on file | Same |
| 12 | Privacy and children's-data legal review (needed before any sync or analytics) | **Not started.** The app is offline today. | Counsel sign-off | `docs/stories/BACKEND_INTEGRATION.md` |
| 13 | Which app is the store product (Capacitor or Expo) | **Product decision pending** | Owner decision recorded in `.ai/DECISIONS.md` | `docs/architecture/MOBILE_ARCHITECTURE.md` |
| 14 | A stage for ages 9 and over | **Product decision pending** | Owner decision | `docs/stories/AGE_STAGES.md` |

## What automated checks already cover

Run `npm test` and `npm run test:e2e`. They cover:

- story logic and every branch;
- answers and numbers in all three languages;
- text completeness and script;
- the generated review sheet and asset manifest;
- the learning stages;
- sync merge and retention rules;
- browser play on desktop and a phone-sized profile;
- axe WCAG 2.1 A/AA;
- keyboard-only play;
- reduced motion;
- bundled Indic fonts;
- the no-voice fallback.

These are not substitutes for any row above.

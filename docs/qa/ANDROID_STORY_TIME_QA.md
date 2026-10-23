# Story Time: Android device QA and accessibility review

## The Android app

The Android app is a **Capacitor 8 shell** (`android/`, `capacitor.config.ts`) that runs the same web build in a system WebView. It is **not React Native**. A separate Expo (React Native) app exists only on unmerged branches, and it has no Story Time (see `docs/architecture/MOBILE_ARCHITECTURE.md`).

What the shell does, from the code:

- **App:** id `app.kidslearning.discovery`, `minSdk` 24, `targetSdk` 36, version 1.0.0 (`versionCode` 1). `MainActivity` is a plain `BridgeActivity`.
- **Permissions.** The manifest *removes* `INTERNET`, `ACCESS_NETWORK_STATE`, `RECORD_AUDIO`, `CAMERA`, location, and `AD_ID`. The app cannot reach the network. Any future sync (see `docs/stories/BACKEND_INTEGRATION.md`) needs `INTERNET` back, along with a privacy review.
- **Data.**
  - `allowBackup="false"` and `fullBackupContent="false"`, with data-extraction rules, so progress is not copied to cloud backup.
  - Progress is stored in WebView `localStorage` and mirrored to Capacitor Preferences.
- **Lifecycle** (`src/platform/androidApp.ts`):
  - The Back button closes an open dialog first, then goes back, and minimises the app at the top level.
  - On `pause`, device speech is cancelled and sound effects are suspended. On `resume`, sound effects resume.
  - Story narration also stops on `visibilitychange`, and that is the path recorded narration would use.
- **Display.** `screenOrientation="fullUser"`. `configChanges` includes orientation, locale, and density, so the activity is not recreated on rotation.
- **WebView debugging** is off (`webContentsDebuggingEnabled: false`). Turn it on in a local debug build only, to read console errors during QA.

What **could not be done** in the development container: no Android SDK is installed, so no APK was built, and nothing was run on an emulator or a real device. Everything in the device checklist below is **pending**.

## Automated checks (run on every change)

`npm run test:e2e` runs Playwright on a desktop Chrome profile and a Pixel 7 profile (mobile viewport and touch). The Pixel 7 profile is not a real device.

| Covered | Spec |
| --- | --- |
| Library, age filter, opening a story | `e2e/story-time.spec.ts` |
| Full Thirsty Crow run: hint, "Show me", completion counted once, learning events | same |
| Resume after reload and from the library | same |
| Language switch mid-story and mid-activity keeps the place | same |
| Both branches of the Clever Rabbit choice | same |
| Bar graph built to real counts, with its questions | same |
| Telugu and Hindi drawn with the bundled Noto fonts | same |
| No voice for Telugu shows the message and the story continues as text | same |
| axe WCAG 2.1 A/AA: no serious or critical issues on library, line, question, pebble pot, bar graph, and Telugu line | `e2e/accessibility.spec.ts` |
| Answering with the keyboard alone | same |
| Reduced motion: system setting and the parent setting both stop animations; animations run otherwise | same |

**Not covered by automation:**

- screen readers;
- real speech voices;
- real touch and gestures;
- WebView differences;
- Android lifecycle;
- low-end performance.

## Manual device checklist

Run on at least:

- **one low-end phone:** Android 8–10, 2–3 GB RAM, about 360×640 dp;
- **one current phone:** Android 14 or later;
- **one tablet,** in both orientations.

Record the device, Android version, WebView version (Settings → Apps → Android System WebView), app build, date, tester, and a result for each row.

**Install and first run**

1. Install a release build. The splash shows and hides. Home opens offline (turn on airplane mode before the first launch).
2. Story Time opens from Home and from the menu. All five stories are listed. Age filters work.

**Playing**

3. Play Kalu and the Thirsty Crow to the end by touch only.
   - Every button responds to one tap.
   - A double tap never skips a line.
   - The pot and pebbles behave correctly.
   - The moral shows.
4. Play each of the other four stories to the end at least once. Clever Rabbit, Monkey and Crocodile, and the Doves have choices: take each branch once.
5. Every activity type works by touch:
   - question, count, add or take away, number line, equal groups, pattern, story order, bar graph, and pebble pot;
   - targets are at least 48 dp and easy for a small finger.
6. Rotate the device mid-line and mid-activity. Nothing resets and nothing is cut off.

**Leaving and returning**

7. Press Home mid-story and reopen from recents. You are on the same line, and narration has stopped and does not resume by itself.
8. Force-stop the app mid-story, then reopen it. "Continue" returns to the same line.
9. Back button:
   - in a story, it returns to the library;
   - with a dialog open, it closes the dialog;
   - in the library, it goes back to Home;
   - on Home, it minimises the app.

**Language and voice**

10. Language: switch between English, Telugu, and Hindi mid-line and mid-activity. The place is kept. Telugu and Hindi are drawn correctly, with no boxes and no broken joins.
11. Voice with an Indian English voice installed: lines are read. The parent's speed, voice, and volume settings apply. Turning Voice off stops reading.
12. Voice for Telugu and Hindi:
    - **without** the language's voice pack, the "no voice" message shows and the words stay on screen;
    - **with** Google TTS Telugu or Hindi installed, lines are read in that language and never with an English voice.
13. Read-to-me turns the pages after each line and stops at activities and choices.
14. Phone call or alarm mid-narration: narration stops and does not talk over the call.

**Settings and data**

15. Captions off ("Words" switch): the caption hides, but TalkBack still reads the line (see 20).
16. Reduce motion (the parent setting, and Android's "Remove animations"): characters and scenes do not move.
17. Parent Settings shows the Story Time summary. Reset All Progress clears story progress.

**Performance and fit**

18. On the low-end phone, a story opens in under about 2 seconds and lines advance without visible lag. Measure, don't guess.
19. Text scaling at 130% and the largest display size: nothing important is cut off. The bar graph labels and story cards are the most likely to break.

## Screen reader (TalkBack): pending

Not yet tested. Do not claim screen-reader support until these pass on a real device with TalkBack:

20. Swipe through a story line. You hear, in order:
    - the scene description (the characters' names);
    - the speaker's name;
    - the line;
    - "Hear it again";
    - "Next".

    In Telugu and Hindi, TalkBack uses that language's voice when it is installed (the text is marked with `lang`).
21. Activities:
    - each option is announced with its text;
    - "Not quite. Try again!" and "Yes! Well done!" are announced when they appear (the feedback area is `aria-live="polite"`);
    - "Show me" is reachable.
22. Pebble pot and bar graph: every button says what it does. For example, "Drop a pebble…" and "Add one to Blue doves, 3 of 3". The graph is announced as one summary: "Bar graph. White doves: 6, …".
23. Story order (sequence) and number line can be completed with TalkBack gestures alone.
24. Choices: both choices are announced and can be activated.
25. Device narration and TalkBack together: note whether they talk over each other. If they do, suggest turning Voice off when TalkBack is on (a possible product change; not built).

## Accessibility review (code and automated checks, 2026-10-23)

| Area | Finding | Status |
| --- | --- | --- |
| Keyboard | Every control is a native button. A story can be read and answered with Tab and Enter (automated test). No keyboard traps found while writing the tests. | Pass (automated, desktop) |
| Accessible names | Buttons have visible text or an `aria-label`. Picture-only buttons, such as "Hear it again" and pebbles, are labelled. The scene is `role="img"` with the characters' names. Decorative art is `aria-hidden`. | Pass (axe, code review) |
| Contrast | axe found two failures, now fixed: the orange library pickers (3.4:1) and the bar-graph buttons with white text on orange or green (3.4:1). No serious or critical issues remain in the scanned Story Time screens. | Fixed |
| Captions | On by default. When turned off, the line stays in the page for screen readers. Narration never carries information that is not on screen. | Pass (code review) |
| Reduced motion | Both the system setting and the parent setting stop animations (automated test). | Pass (automated) |
| Language | Story text carries `lang="te"` or `lang="hi"`, so screen readers can switch voice. | Pass (code review); TalkBack pending |
| Screen reader | Not tested. | **Pending** |
| Outside Story Time (not changed) | The same orange and green PillPicker pattern appears in Puzzle Planet (`PuzzlePlanet.tsx:71-72`) and Letter Tracing (`LetterTracing.tsx:143-144`). It is likely the same 3.4:1 contrast issue. Those screens were not scanned. | Reported, not fixed (out of scope) |

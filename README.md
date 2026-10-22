# Kids Learning

Kids Learning is a local-first app for early letters, numbers, animals, words, music, quizzes, a daily challenge, and achievements. Progress stays on the device. The web app and the Android app use the same React project.

## Web

Prerequisites: Node.js 22 or newer (this project was set up with Node 24).

```powershell
npm install
npm run dev
```

Open http://localhost:5173/. Other checks:

```powershell
npm test
npm run lint
npm run build
```

## Artwork and fonts

Everything the app shows is bundled, so it looks the same on every device and works offline.

- **Illustrations:** [Fluent Emoji](https://github.com/microsoft/fluentui-emoji), flat style, © Microsoft Corporation, MIT License. One SVG per picture lives in `src/assets/illustrations/`, with the licence notice in `src/assets/illustrations/LICENSE.txt`. They come from the `@iconify-json/fluent-emoji-flat` dev dependency.
- **Mascot and decorations:** Pip the owl and the background shapes are inline SVG drawn for this app.
- **Fonts:** Fredoka and Nunito, both SIL Open Font License 1.1, through `@fontsource`.

The app's data and screens still name each picture with an emoji character, and `src/data/illustrations.ts` maps it to the bundled SVG. If no SVG exists, the emoji itself is shown. After adding or changing an emoji anywhere in `src/`, regenerate the files:

```powershell
npm run illustrations
```

The script prints any emoji without a Fluent illustration, and `src/data/illustrations.test.ts` fails if a letter, number, animal, word, category, badge, or section has no picture.

## Native mobile app

The installable React Native app lives in `mobile/`. It is a separate Expo project, not a WebView around this site. The Capacitor Android shell in `android/` is unchanged.

Shared lessons, quiz rules, achievement checks, and progress parsing live in `packages/learning-core`. The website re-exports that package, so the web app and the phone app use the same content and scoring. Progress saved in a browser does not appear on the phone.

Setup, run, test, and store-build commands are in `mobile/README.md`.

## Android

The Android app is a Capacitor 8 shell around the built web app. The application ID is `app.kidslearning.discovery`. Change that ID only before the first Play upload. After an artifact is uploaded, Play Console keeps the ID.

The project targets Android 16 (API 36), which is the target API Google Play requires for a new app submission as of August 31, 2026. See [Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878). Minimum Android version is the Capacitor 8 minimum, API 24.

### Prerequisites

- Node.js 22 or newer
- Android Studio Otter 2025.2.1 or newer, with Android SDK 36
- JDK 21. Android Gradle Plugin 8.13 and Gradle 8.14.3 do not run on JDK 25 (`Unsupported class file major version 69`). Set `JAVA_HOME` to JDK 21 before `gradlew`.
- A device or emulator. This repository does not install the Android SDK for you.

`android/local.properties` is created by Android Studio or Capacitor and points at the SDK. It is not committed.

### Run on a device or emulator

Connect a device with USB debugging, or start an emulator, then:

```powershell
npm run android:run
```

That builds the web app, copies it into the Android project, and installs the debug build. The browser app is unchanged: `npm run dev` still runs the web version.

To open the project in Android Studio after a sync:

```powershell
npm run cap:sync
npx cap open android
```

### Release bundle

The release build is an Android App Bundle (`.aab`) for Play Console. It is signed only when `android/keystore.properties` exists. That file is gitignored. Copy `android/keystore.properties.example` and point it at a keystore you create and store outside the repository.

Create a keystore once. Replace the placeholder name and keep the file private:

```powershell
keytool -genkeypair -v -keystore kids-learning-release.jks -alias kidslearning -keyalg RSA -keysize 2048 -validity 10000
```

`android/keystore.properties`:

```properties
storeFile=C:/path/outside/the/repo/kids-learning-release.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=kidslearning
keyPassword=YOUR_KEY_PASSWORD
```

Then:

```powershell
npm run android:bundle
```

The bundle is written to `android/app/build/outputs/bundle/release/app-release.aab` when signing is configured. Without `keystore.properties`, the release task is not signed for Play upload. Do not commit the keystore or the passwords.

Version name `1.0.0` and version code `1` are in `android/app/build.gradle`. Raise the version code for every Play upload.

### What the Android shell handles

- Back closes a parent dialog first, then returns to the previous screen. On the home screen it moves the app to the background.
- The layout can rotate. Safe-area padding is applied for the status bar and gesture area.
- Pausing the app stops speech and sound. Resuming restores the audio context. Progress is already on the device.
- Learning content, illustrations, and fonts are bundled (see Artwork and fonts). The app does not load Google Fonts, remote images, or a remote speech service.
- No microphone, camera, location, advertising ID, analytics, or ad SDK is requested. Android backup of app data is off.

## Play Console, for the owner

Nothing in this repository publishes the app, creates a developer account, or accepts store terms. Completing the steps below does not guarantee review or acceptance.

Official references used for this setup:

- [Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878) (new apps target API 36 from August 31, 2026)
- [Families policies](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Data practices in Families apps](https://support.google.com/googleplay/android-developer/answer/11043825)
- [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Content rating and target audience](https://support.google.com/googleplay/android-developer/answer/9859655)
- [Testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465)

Before production, the owner still has to:

1. Create or use their own Play Console developer account and accept Google’s current terms themselves.
2. Finish and host `docs/PRIVACY_POLICY_DRAFT.md` at a public URL. Replace every placeholder, including the contact method. Put that URL in the store listing and in the app content section. The in-app Privacy screen describes current behavior; it is not the hosted policy.
3. Choose the target age groups honestly. This app is built for young children and includes a parent area. If any selected group includes children, the Families policy applies, including an accurate privacy policy and no advertising identifier for a child-only app. This project does not request the advertising ID and does not ship an ads SDK.
4. Complete the content rating questionnaire. Describe an educational app without user chat, ads, purchases, location, or user-generated content.
5. Complete Data safety from what this version actually does: learning progress and settings stay on the device, are not sent to the developer, and are not shared. Speech and sound are on-device. Say that there are no ads. If a later build adds a network call, update the form before you ship it.
6. Declare that the app does not contain ads.
7. Prepare the store listing: title, short and full description, icon, feature graphic, and phone and tablet screenshots from a real device. Do not use screenshots that show a child’s personal information.
8. Upload `app-release.aab` to a test track. The application ID becomes fixed once an artifact is uploaded.
9. For a personal developer account created after November 13, 2023, Play Console currently requires a closed test with at least 12 testers opted in continuously for 14 days before you can apply for production. Confirm that rule in Play Console, because account type and policy can change. An organization account can have different testing access.
10. Install the release on a phone and a tablet. Check rotation, the system back gesture, offline mode, speech with the device’s own voices, sound and volume, the daily challenge, and reset after the parent check.

This app is not enrolled in any Families program by being built this way. Designed for Families, or a similar badge, is a Play Console choice and a review outcome, not something this project can claim.

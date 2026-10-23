# Story Time: backend integration design

**Status: design only.**

- No backend exists for this app. Nothing in this document is implemented, deployed, or agreed with a server team.
- The endpoint paths below are **proposals**. They are not existing APIs.
- Today the app is fully offline:
  - the Android manifest removes the `INTERNET` permission;
  - Story Time progress is stored only on the device, in `localStorage` key `kids-learning-stories`, mirrored to Capacitor Preferences.

## What already exists to build on

- **Story progress model.** `src/features/stories/engine/progress.ts` defines it:
  - `StoryRecord`: where to resume, completed runs, and completed versions.
  - `LearningEvent`: one record per solved activity per run, with tries, clean, hint, demo, and day.
  - These types have no React or DOM imports, so a client or server can share them.
- **Parent account contract, on an unmerged branch.** Branch `cursor/mobile-auth-onboarding-8089` replaces this project with a standalone **Expo / React Native** app.
  - It has parent sign-in, verification, and child profiles.
  - Its `src/auth/contract.ts` defines client calls to `/v1/auth/*`, `/v1/children`, and `/v1/session/child`.
  - It says itself that no server implements them.
  - That branch is not on `main`, and this Capacitor app does not use it.
  - The design below **reuses that contract's shapes** (`SessionGrant`, `ChildProfile`), so the two apps would not need two account systems.
  - Age bands: Story Time now uses the same `3-4`, `5-6`, `7-8` bands as learning stages (`engine/stages.ts`, `docs/stories/AGE_STAGES.md`).

## Principles

1. **Offline first.** A child can always play every story they have access to, with no network. Sync happens in the background and never blocks play.
2. **Sync is a parent's choice.** It is off until a parent signs in and turns it on. Without an account, the app behaves exactly as today.
3. **Collect the minimum.** For a child, the server holds only:
   - a parent-chosen nickname;
   - an age band;
   - an avatar;
   - the learning events and resume points below.

   It holds no real name, birth date, photo, voice, location, contacts, or free text written by the child.
4. **The parent owns the data.** A parent can see it, export it, and delete it.
5. **Never lose progress, never double count.** Every upload can be retried safely.

## Authentication

- **Only the parent signs in**, using the unmerged branch's flow: login or register, verification, then refresh. A child never has credentials.
- **The session grant** is `{ accessToken, refreshToken, expiresAt, parent }`.
  - Access tokens are short-lived (for example 15 minutes).
  - Refresh tokens are rotated on every use and can be revoked from the server.
- **Token storage.**
  - On Android, tokens must go in hardware-backed secure storage (Android Keystore).
  - Capacitor Preferences is **not** secure and must not hold tokens. A secure-storage plugin would need choosing and reviewing. None is installed today.
- **Child profile.** After sign-in, the parent picks or creates a profile (`ChildProfile`: `id`, `nickname`, `ageBand`, `avatar`). Every Story Time call is scoped to `childId`.
- **Parent gate.** Signing in, turning sync on, buying, and deleting all sit behind the app's existing parent area, not in child screens.

## Entitlements (which stories a child can open)

Proposal:

```
GET /v1/entitlements            (parent token)
→ 200 { version: 7, expiresAt: 1767225600000,
        grants: [{ product: 'stories-core', storyIds: ['thirsty-crow', …] },
                 { product: 'stories-plus', storyIds: ['…'], until: 1798761600000 }] }
```

- **The server is authoritative.** Purchases (Google Play Billing) are verified on the server from the purchase token, never trusted from the client.
- **Offline cache.** The client caches the last response with its `expiresAt`. It allows a grace period of, for example, 14 days offline before locking paid stories again.
  - The five current stories should stay free, so a child never loses a story they already had.
- **Locking never deletes progress.** A locked story keeps its progress and learning events. They show again if access returns.
- **Content.**
  - Bundled stories need no download.
  - Future downloadable stories would be signed packages, checked with the same `validateStory` before publishing on the device.
  - The story schema needs no new field. Entitlement is a map from product to story ids kept outside the story data.

## Progress sync

The sync design lives in **`docs/stories/SYNC.md`**, which supersedes the earlier version of this section. It covers:

- run and event identity;
- idempotent uploads;
- acknowledgement, retention, and deletion rules;
- retry and offline recovery;
- conflicts between devices;
- story version changes;
- the proposed API contract;
- a migration plan that keeps today's offline app working.

The client-side rules are tested in `src/features/stories/engine/sync.ts`.

**Never sent:**

- language-switch history;
- time spent per line;
- answers chosen, beyond tries, hints, and demonstrations;
- anything typed.

## Parent access

Proposals:

```
GET    /v1/children/{childId}/story-summary     → per objective: practising / succeeding / mastered (same rule as the app)
GET    /v1/children/{childId}/export            → JSON of everything held for the child
DELETE /v1/children/{childId}                   → deletes the profile and all its progress
DELETE /v1/children/{childId}/story-progress    → deletes Story Time data only
```

- **Mastery** is calculated with the same rule the app uses (`summarizeObjectives`): 3 clean solves across 2 activities. Use the same code where possible, so parents never see two answers.
- **Only the signed-in parent** can read or change their children's data. Every request checks that `childId` belongs to the token's parent.
- **Deletion** removes data from live systems at once and from backups within a stated period. Account deletion must also be possible from outside the app, as Google Play requires.

## Analytics (privacy-conscious)

- **Off by default.** Turned on only with the parent's consent, separate from sync.
- **No third-party analytics or advertising SDKs.** No advertising id: the manifest already removes `AD_ID`.
- **What could be collected:** a small, fixed list of counts. For example:
  - stories started and finished;
  - activities solved first try;
  - "no voice for this language" shown;
  - crashes.

  Counts are aggregated per day and per app version, with no `childId`, no `installId`, and no free text.
- **Thresholds.** Report only counts of 10 or more, to make individuals hard to single out.
- **Purpose.** Product questions only: which stories are too hard, where children get stuck, and whether Telugu and Hindi voices are missing.
- **Law.** Before launch, review the design against:
  - India's Digital Personal Data Protection Act 2023 and its Rules. These require verifiable parental consent, and do not allow tracking, behavioural monitoring, or targeted advertising directed at children.
  - COPPA, if the app is offered in the US.
  - Google Play's Families policy.

  This needs legal review. It has not been done.

## Open decisions for the product owner

1. Who builds and runs the server, where, and with what data residency.
2. Which stories are free and which are paid, and the offline grace period.
3. One account system shared with the Expo app branch, or none. Also settle the age bands.
4. Which secure-storage plugin to use for tokens on Android.
5. Whether to turn on analytics at all.

# Story Time: progress sync specification

**Status: specification.**

- No server exists. Nothing here is deployed, and the app does not sync.
- The endpoint paths are **proposals** for whoever builds the server. They are not existing APIs.
- The client-side rules (identity, merging, retention) are implemented and unit-tested as pure functions in `src/features/stories/engine/sync.ts`. The app does not call them yet.
- The only change that affects the app today is the run id format (see "Run identity").

This document replaces the sync parts of `BACKEND_INTEGRATION.md`. Authentication, entitlements, parent access, and analytics stay there.

## Where progress lives today

`kids-learning-stories` in `localStorage`, mirrored to Capacitor Preferences on Android. Shape (`engine/progress.ts`):

```ts
StoryProgressData = { schema: 1, stories: Record<storyId, StoryRecord>, events: LearningEvent[] }
StoryRecord      = { playback?, completedRuns: string[], completedVersions: number[], lastLang, startedAt, updatedAt }
LearningEvent    = { runId, storyId, activityId, objectives, tries, solved, clean, hint, demo, day }
```

Two silent limits exist today. Both are acceptable while progress is local-only. Both must change before sync, because they would drop data the server has not received:

| Limit | Where | Today | With sync |
| --- | --- | --- | --- |
| 500 learning events | `MAX_EVENTS` in `recordActivity` | Oldest dropped | Drop only acknowledged events (`retainEvents`) |
| 50 completed runs per story | `savePlayback` | Oldest dropped | Drop only acknowledged completions, by the same rule |
| Storage full | `safeSet` in `services/storage.ts` | Write fails silently | Report it, and keep the in-memory copy until a write succeeds (see "Offline recovery") |

## Run identity

A **run** is one play-through. Completions and learning events are counted once per run.

- **New runs** (from this branch on) get `newRunId()`: `<storyId>-<milliseconds>-<8 random base-36 characters>`. For example, `thirsty-crow-1761200000000-k3j9x0aa`. Two devices starting the same story in the same millisecond still get different ids.
- **Legacy runs** (`<storyId>-<milliseconds>`, made before this change) could collide across devices.
  - Before a device's first upload, `namespaceLegacyRunIds(data, installId)` appends the device's random install id to every legacy run id.
  - It renames events, completed runs, and the resume point together, so nothing is counted twice.
  - Running it again changes nothing.
- **`installId`** is a random id the app generates once, on the first sync. It is never a hardware id, advertising id, or account id, and it is not sent with analytics.

## Event identity and idempotency

- **`eventKey`** = `<runId>/<activityId>`.
  - `recordActivity` already records at most one event per run and activity.
  - Run ids are unique (see "Run identity"), so the key is unique for a child and stable across retries.
  - The server stores it as the primary key within a child: `(childId, eventKey)`.
- **Events are immutable.** If the server already has an `eventKey`, it keeps the first copy and reports the new one as a duplicate. A duplicate is a success for the client.
- **Completion identity** is `(childId, storyId, runId)`. A second upload is a duplicate, and is also a success.
- **Every upload request carries an `Idempotency-Key` header** (a random UUID per batch). A retry after a timeout returns the first response rather than doing the work again.

## Acknowledgement and deletion rules

1. **Acknowledgement.** An event or completion counts as acknowledged only after the server returns it in `accepted` or `duplicate` for a request this device made. Never acknowledge because a request was *sent*, or because the device is offline.
2. **What is stored.** The device keeps the set of acknowledged keys next to the progress data. A suitable key is `kids-learning-stories-sync`, holding `{ installId, acknowledged: string[], lastPullCursor }`.
3. **Deletion.** `retainEvents(events, acknowledged, limit)` drops acknowledged events oldest first, only while over the limit (500). **Unacknowledged events are never dropped.** The same rule applies to completed runs (limit 50 per story).
4. **When unacknowledged data exceeds a limit,** `overLimit` is true. Parent Settings then shows "Progress is waiting to sync". Nothing is dropped. A hard ceiling is kept only to protect storage: for example, 5,000 events, which is roughly 1 MB. If that ceiling is reached, recording stops and the parent is told. Data is still not dropped.
5. **Sign-out.** Unacknowledged data stays on the device. Signing out asks first if anything is still waiting.
6. **Parent deletion** (`DELETE` below) is the only path that removes acknowledged data on the server. It also clears the device's copy for that child when the parent asks.

## Retry and offline recovery

- **When the app syncs.** Sync runs:
  - when the app opens;
  - after a story ends;
  - when the app returns to the foreground;
  - every few minutes while it is open and online.

  It never blocks play.
- **Order.** Upload events in batches of 100, oldest first (`pendingBatches`), then completions, then resume points. After that, pull.
- **Retries.**
  - Network errors, timeouts, and 5xx responses use exponential backoff with full jitter: 2 s, 4 s, 8 s, and so on, up to 10 minutes.
  - On 429, wait for `Retry-After`.
  - 4xx responses other than 401, 409, and 429 are bugs. Stop retrying that batch, keep the data, and report it to the developer log without the content.
- **On 401,** refresh the token once, then ask the parent to sign in again. The data waits.
- **Losing a write.** If the app dies mid-request, the next run sends the same batch again. Duplicates are successes, so nothing is double counted.
- **Storage full.**
  - Keep progress in memory for the session and show the parent a message.
  - Try the write again after the next sync has trimmed acknowledged data.
  - Today the write fails silently (`safeSet`). Fix that before sync.

## Concurrent devices and conflicts

`mergeProgress(local, remote)` defines the rules. They give the same events and completions whichever side merges first, and merging again changes nothing.

| Data | Rule | Why |
| --- | --- | --- |
| Learning events | Union by `eventKey`. The first copy wins. | Events are facts that never change. |
| Completed runs and versions | Set union. | A run counts once, whichever device finished it. |
| `startedAt` | Earliest of the two. | |
| Resume point, `lastLang` | Newest `updatedAt` wins. On a tie, this device's copy stays. | A resume point is disposable. The worst case is resuming at a slightly older line. |

- **Two devices in the same story at once.** Both keep playing. Events from both are kept. The resume point follows whichever device saved last.
- **Clock skew.**
  - `updatedAt` only decides between resume points, and they are disposable.
  - The server also records its own receive time.
  - For pulls it uses its own cursor, never device clocks.

## Story version changes

- `StoryManifest.version` is raised whenever scenes change.
- A resume point saved for another version is kept, but it is **not resumed**. The existing `canResume` rule restarts the story from the beginning.
- Learning events and completions from older versions stay valid. They count toward the parent summary.
- `completedVersions` records which versions a child has finished.
- **Known limitation.** If an older app on one device saves a resume point after a newer app on another device, the newer device's resume point is replaced by the old-version one. The newer device then restarts the story. No events or completions are lost. Fixing this would mean preferring the higher version in the merge, which needs a product decision.

## API contract (proposal)

All calls need a parent access token. The `childId` must belong to the token's parent, otherwise the server returns 404.

```
POST /v1/children/{childId}/story-events
  Idempotency-Key: <uuid>
  { "events": [ { "eventKey": "thirsty-crow-1761200000000-k3j9x0aa/can-reach", "runId": "…", "storyId": "thirsty-crow",
                  "storyVersion": 1, "activityId": "can-reach", "objectives": ["comparing"], "tries": 2, "solved": true,
                  "clean": false, "hint": true, "demo": false, "day": "2026-10-23" } ] }        max 100 per request
  → 200 { "accepted": ["…"], "duplicate": ["…"], "rejected": [{ "eventKey": "…", "reason": "invalid" }] }

POST /v1/children/{childId}/story-completions
  Idempotency-Key: <uuid>
  { "completions": [ { "storyId": "thirsty-crow", "runId": "…", "version": 1, "day": "2026-10-23" } ] }
  → 200 { "accepted": [runId…], "duplicate": [runId…] }

PUT /v1/children/{childId}/story-playback/{storyId}
  { "playback": Playback, "lastLang": "te", "updatedAt": 1761200000000 }
  → 200 { "stored": true }
  → 409 { "current": { "playback": …, "lastLang": …, "updatedAt": … } }    server copy is newer; client merges, does not retry

GET /v1/children/{childId}/story-progress?cursor=<opaque>
  → 200 { "events": […], "completions": […], "playback": { storyId: {…} }, "cursor": "<opaque>", "more": false }
```

- `rejected` events are kept on the device and reported, never dropped.
- `storyVersion` is added to events at upload. Today's local events do not store it.
- `day` is the local calendar day, with no time of day.

## Migration plan (keeps today's offline app working)

1. **Done on this branch.** New run ids are collision-resistant. The merge, identity, and retention rules are tested in `engine/sync.ts`. The app's behaviour is unchanged.
2. **Before any network code:**
   - Move the storage layer's dependency on the stories feature into `engine/` types.
   - Make storage-full visible.
   - Add `kids-learning-stories-sync` with `installId` and `acknowledged`.
   - With sync off, keep today's 500 and 50 trimming, because nothing is waiting for a server.
3. **Turning sync on** (parent signs in and opts in):
   1. Run `namespaceLegacyRunIds`.
   2. Switch trimming to `retainEvents`.
   3. Upload everything pending.
   4. Pull and `mergeProgress`.

   If the parent turns sync off, the device keeps its data and goes back to local trimming only for acknowledged items.
4. **Android shell.** Re-add `INTERNET`, add an HTTPS-only network security config, and use secure token storage. Update the privacy policy, the in-app privacy page, and the Play Data safety form.
5. **Tests to add with the client:**
   - outbox survives an app kill;
   - duplicate responses are treated as success;
   - 401 refresh;
   - 429 back-off;
   - storage full;
   - two simulated devices converging.

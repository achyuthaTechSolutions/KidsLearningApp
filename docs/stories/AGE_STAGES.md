# Learning stages (age bands)

## The decision

There is one age grouping, the **learning stage**: `3-4`, `5-6`, or `7-8` years.

- It is the same set of values as `AgeBand` in the parent-account contract (`src/auth/contract.ts` on the unmerged Expo branch `cursor/mobile-auth-onboarding-8089`). A child profile created there is already in this model.
- Code: `src/features/stories/engine/stages.ts`. Tests: `engine/stages.test.ts`.
- **Stories keep their exact `ageRange` in years**, for example `[4, 7]`. A story suits a stage when the two ranges overlap.
- The Story Time library filter now offers *All ages*, *Ages 3–4*, *Ages 5–6*, and *Ages 7–8*. Before, it offered the overlapping bands 3–5, 5–7, and 7–9.

**Why the account bands are the canonical ones:**

- They are what a parent chooses, and what a server would store against a child.
- They do not overlap, so every age from 3 to 8 is in exactly one stage.
- Story Time's old bands overlapped (5 was in two bands), so they could not classify a child.

## Rules

| Input | Result |
| --- | --- |
| Age 3 or 4 (whole years; 4.9 counts as 4) | `3-4` |
| Age 5 or 6 | `5-6` |
| Age 7 or 8 | `7-8` |
| Under 3, 9 or over, missing, or not a number | **No stage.** Every story is shown and no stage is assumed. |
| A stored value that is exactly `3-4`, `5-6`, or `7-8` | That stage |
| Anything else, including the old filter values `3-5`, `5-7`, and `7-9` | **Unknown,** treated as no stage. It is never guessed or mapped to the nearest stage. |

Which stories each stage shows today:

| Stage | Stories |
| --- | --- |
| 3–4 | Thirsty Crow, Clever Rabbit, Lion and Mouse |
| 5–6 | All five stories |
| 7–8 | Clever Rabbit, Lion and Mouse, Monkey and Crocodile, Cooperative Doves |

A content test requires every story to fit at least one stage.

## Migration

- **Web and Capacitor app.** Nothing to migrate.
  - The old age filter was screen state only, and was never saved.
  - The app has no child profiles and stores no age.
- **Expo app.** Child profiles already use these values. Its production client accepts only `3-4`, `5-6`, and `7-8` from the server.
  - There is no server, and its development mock keeps profiles in memory, so no real profiles exist yet.
- **Future.** A stage is changed only by the parent. Nothing reclassifies a child automatically, for example on a birthday.
  - If the product later adds a stage (for example 9–10), add it as a **new** value.
  - Existing profiles keep their stage until a parent changes it, and both apps must be updated together. A test in `stages.test.ts` pins the list, so changing it is deliberate.

## Needs a product decision

Ages 9 and over currently have no stage, although the Doves story is written for ages 5–9. Whether to add a 9+ stage is for the product owner to decide.

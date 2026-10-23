# Story Time artwork and narration

This is the contract for adding final artwork and recorded narration to Story Time. Adding assets needs no change to story data, the player, or the engine: put a correctly named file in the right folder, record where it came from, and run the tests.

As of 2026-10-23, **no final artwork and no recorded narration exist**. Every slot uses development art or device speech. `asset-manifest.csv` lists every slot and its current status.

## The asset manifest

`docs/stories/asset-manifest.csv` is generated from the stories by `src/features/stories/content/assets.test.ts`. It is checked on every `npm test`. When a story or a bundled file changes, regenerate it with `npx vitest run src/features/stories/content/assets.test.ts -u`.

| Column | Meaning |
| --- | --- |
| `story_id` | Story, such as `thirsty-crow`. `shared` is for text used by every story. |
| `scene_id` | Scene where the slot appears. A backdrop or character used in several scenes is listed once per scene. |
| `asset_id` | Stable id. This is also the file name, without its extension. |
| `kind` | `backdrop`, `character`, `prop`, or `narration`. |
| `language` | `en`, `te`, or `hi` for narration. Empty for art, which has no text in it. |
| `status` | `bundled`, `development art`, or `device voice or text`. |
| `format` | The bundled file's format, or the formats a replacement may use. |
| `provenance` | Source and licence of the file in use. |

## Artwork

### Where files go

```
src/assets/stories/art/character.<characterId>.<svg|png|webp>   e.g. character.kalu.webp
src/assets/stories/art/backdrop.<backdropId>.<svg|png|webp>     e.g. backdrop.dry-field.webp
```

- **Character ids:** `narrator`, `kalu`, `rabbit`, `lion`, `mouse`, `monkey`, `crocodile`, `dove-king`, `doves`, `deer`. They are defined in `content/characters.ts`.
- **Backdrop ids:** `dry-field`, `forest`, `forest-well`, `river`, `tree-river`, `meadow`, `sky`. They are defined in `content/library.ts`.

`src/features/stories/assets.ts` finds these files at build time. When a file exists, `player/Stage.tsx` draws it instead of the development art. When it does not exist, the development art stays. Nothing else changes.

### Requirements

- **Characters**
  - One image per character, facing the viewer or slightly right, standing on the bottom edge, on a transparent background.
  - Square canvas: SVG, or PNG/WebP at 512×512 px or larger.
  - Under 150 KB each.
  - The player adds the expression animations (bounce, tilt, shake) and the expression marks (✨ 💭 ❗ 💧), so one neutral pose is enough. Per-expression art would need a small player change and is not part of this contract.
- **Backdrops**
  - Landscape and full-bleed. Draw for 16:9 at 1920×1080 or larger. Phones crop to 4:3 from the centre, so keep important detail within the middle 75% of the width.
  - WebP preferred, under 300 KB each.
  - The bottom 12% is where characters stand, so keep it as ground.
- **All art**
  - No text, numbers, or answers inside images. Text must be translatable, and answers must come from the activity data.
  - Must read clearly at 90×90 px on a phone.
  - Avoid large areas of the story text colour behind the caption.
- **Props and activity pictures** (pot, pebbles, grains, and so on)
  - These are the app-wide illustrations in `src/assets/illustrations/`, keyed by emoji.
  - Replacing one changes it in every game. That is a separate, app-wide decision.

### Provenance and licensing

Every file under `src/assets/stories/` must have an entry in `assetProvenance` in `content/assetManifest.ts`:

```ts
'character.kalu': { source: 'Commissioned from <artist>, 2027, contract #…', license: 'Work for hire, all rights assigned' },
```

The test `has provenance for every bundled replacement file` fails if any file is missing an entry. Acceptable licences:

- work for hire with rights assigned;
- a licence that explicitly allows use in a commercial app, with attribution recorded here if the licence requires it.

Do not use AI-generated or found images unless their licence for this use has been confirmed and recorded.

## Narration

### How narration is chosen

For every line, activity question, and ending moral, the player tries these in order:

1. **A recorded file**, either the one the line names in its `audio` field or the one at the conventional path below.
2. **The device's voice** for the chosen language. Telugu and Hindi are never read with an English voice.
3. **Text only**, with a short message that the device has no voice for this language.

If a recorded file fails to play, the player falls back to the device voice. Narration follows the parent's Voice, volume, and speed settings. Speed applies to the device voice only, because recordings play at their recorded pace. Narration stops when the app goes to the background.

**Not yet verified:** the recorded-file path has never played a real file, because none exists. Its file lookup is unit-tested; playback is not. The first real recording must be checked on a device, including volume, stopping on background, and falling back to the voice when a file is broken.

### Where files go

```
src/assets/stories/narration/<lang>/<text key>.<mp3|m4a|ogg>
```

The text key is the `key` column of `docs/localization/story-review-sheet.csv`. Examples:

```
src/assets/stories/narration/te/thirsty-crow/hot-day/crow-1.mp3          a line
src/assets/stories/narration/hi/thirsty-crow/the-pot/can-reach.prompt.mp3 an activity question
src/assets/stories/narration/en/thirsty-crow/moral.moral.mp3               the moral (the scene is called `moral`)
src/assets/stories/narration/te/ui.whatNext.mp3                           "What should happen next?"
```

The `asset_id` column of the manifest gives the exact path for every narration slot, without the extension. The five stories have 267 narration slots: 89 per language.

A line may name a different file in its `audio` field, for example to reuse one recording of "Caw!" across lines: `audio: { te: 'te/shared/caw' }`. Validation hides a story whose `audio` names a file that is not bundled. A missing file at the *conventional* path is not an error: that slot simply uses the device voice.

### Recording specification

- **Script.** Record the exact text in the review sheet's `en`, `te`, or `hi` column, and only **after** that language has passed native review. Recording draft text means recording it again later.
  - For a moral, record "<the word for 'The lesson'>: <moral>", which is what the device voice says today.
- **Voice.**
  - One warm, calm narrator per language, a native speaker.
  - Character voices may differ slightly in pitch and energy, but every line must be easy to understand for a 3-year-old.
  - Speak slower than conversation: about 120–140 words a minute in English, and a similar unhurried pace in Telugu and Hindi.
- **Format.**
  - Master as WAV, 48 kHz, 24-bit, mono.
  - Deliver to the app as mono MP3 at 64–96 kbps (or AAC in M4A).
  - Target −16 LUFS integrated loudness, −1 dBTP true peak, so every line plays at the same level.
- **Edit.** 150–250 ms of silence before and after each line. No music, no sound effects, no breaths at the edges, no clipping, and no room echo.
- **Size.** Mono at 64 kbps is about 8 KB per second. The five stories are roughly 2,000 English words, so expect about 15 MB for all three languages. Measure the APK size after adding narration.
- **Rights.** Get a signed release from each voice actor for use in the app, in all territories, with no time limit. Record it in `assetProvenance`.
- **Check.** After adding the files, run `npm test` and regenerate the manifest. Play each story in each language on a device, and confirm that each line matches its caption.

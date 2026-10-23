# Play games

This page describes the games under **Learning Games** (`/games`), how each one judges answers, and what it stores. Everything runs on the device. No game sends data anywhere, uses the camera or microphone, or shows ads.

## Catalogue

The hub groups games by category. The list lives in `src/features/learning-games/catalog.ts`. Game ids there are also progress keys, so do not rename one that has shipped.

| Category | Game | Route | Folder |
| --- | --- | --- | --- |
| Letters and Words | Letter Tracing | `/games/tracing` | `features/letter-tracing` |
| | Alphabet Catcher | `/games/alphabet-catcher` | `features/alphabet-catcher` |
| | Word Builder | `/spell` | `features/word-builder` |
| | Balloon Pop | `/balloons` | `features/balloon-pop` |
| Logic and Puzzles | Little Robot Adventure | `/games/robot` | `features/robot-adventure` |
| | Puzzle Planet | `/games/puzzle` | `features/puzzle-planet` |
| | My Photo Puzzle | `/games/photo-puzzle` | `features/photo-puzzle` |
| | Shadow Detective | `/games/shadow` | `features/shadow-detective` |
| | Memory Match | `/memory` | `features/memory-match` |
| Music and Sounds | Rhythm Hero | `/games/rhythm` | `features/rhythm-hero` |
| | Sound Safari | `/games/sound-safari` | `features/sound-safari` |
| Pretend Play and Feelings | Little Chef | `/games/chef` | `features/little-chef` |
| | Emotion Explorer | `/games/emotions` | `features/emotion-explorer` |
| Science and Discovery | Space Explorer | `/games/space` | `features/space-explorer` |
| Move and Play | Number Racer | `/games/racer` | `features/number-racer` |
| | Dino Dash | `/dino` | `features/dino-dash` |

The five quiz games (Find the Letter, Guess the Animal, Count, Match the Word, Listen and Choose, plus Odd One Out and What Comes Next) still start inside the hub.

The `/games/*` games load on first visit (`React.lazy` in `src/App.tsx`), with a short "Getting the game ready" screen while the code loads.

## Shared pieces

- `GameIntro`: the "How to play" screen, with numbered picture steps, **Hear instructions**, and a level picker.
- `GameHeader` and `GameResults` (`GameChrome.tsx`): the play header (back, title, score, progress) and the end-of-round card. Both scroll to the top when they appear, because starting a game does not change the route.
- `useGameFeedback`: speech and sound effects that follow the parent's speech on/off, speed, voice, sound on/off, and volume settings at the moment they play.
- `ScreenReaderStatus`: a polite live region for feedback.
- `random.ts`: `pick` and `shuffle` that take an injectable random source, so every generator can be tested with a seed (`mulberry32`).
- `motion.ts`: reduced-motion and "is this a form field" helpers.

## Levels

Parent Settings → **Games** sets the starting level for every game. Each intro screen opens at that level, and the child can still change it before playing. The suggested ages are hints only.

| Level | Label | Typical changes |
| --- | --- | --- |
| `beginner` | Beginner | 2 or 3 choices, guided steps, slow movement, wide tracing tolerance |
| `intermediate` | Explorer | 3 or 4 choices, short sequences, more puzzle pieces |
| `advanced` | Champion | 4 to 6 choices, longer sequences, command limits, two shadows at once |

## The games

**Letter Tracing.** Uppercase, lowercase, or both, in alphabet order (skipping letters already traced) or as a surprise. The round is five letters. Each letter has hand-made stroke guides in `strokes.ts`. Numbered green dots and arrows show where each stroke starts, and **Show me** animates the strokes. Scoring is coverage, not handwriting recognition (`tracing.ts`):

1. Each guide stroke is sampled every 3 units in a 100 × 100 box.
2. A sample counts as covered when the child's ink passes within the tolerance of it: 13 units at Beginner, 10 at Explorer, 8 at Champion.
3. The letter is complete when every stroke is at least 70%, 75%, or 80% covered, and at least half of the ink stays near the guide. The second rule stops a scribble over the whole box from counting.

Stroke order and direction are shown but not enforced. Drawing uses pointer events with pointer capture on the SVG only (`touch-action: none` there), so the page still scrolls elsewhere. **Skip this letter** and **Show me** are the non-drawing ways through.

**Alphabet Catcher.** Pip names a letter and the child taps it, or types it on a keyboard. Letters can stay still (the default) or fall slowly and loop back to the top, so nothing is ever missed. Choices are 3, 4, or 6 by level; rounds are 5, 10, or 15 letters. Phonics mode says the letter's sound instead of its name and never shows two letters with the same sound (C and K). A catch counts once. Falling letters pause on the Pause button or when the tab is hidden.

**Number Racer.** The child's car drives up a three-lane road toward a row of gates. A sign asks a number question, and each gate carries an answer. The child steers into the lane with the right answer by tapping a lane, using the Left and Right buttons, the arrow keys (or A and D), or 1, 2, and 3.

- **Questions:** Beginner asks "Drive to 4" or to count up to 5 pictures. Explorer adds and takes away within 10. Champion works within 20 and adds missing numbers ("4 + ? = 9").
- **A wrong lane is gentle:** nothing crashes and the race never ends. The answer and why are shown, then the same question comes back with the lanes shuffled and the car slower. After two misses, the right gate glows.
- **Timing:** gates take 8, 6.5, or 5.5 seconds to arrive, and longer under reduced motion. Pause stops the gate, and so does hiding the app.
- **Race:** 5 or 10 gates. Stars count answers right on the first try. The car comes in four colours, drawn from above in code.
- **Code:** `engine.ts` holds the rules (questions, gates, passing, stars) with no timing. The screen moves the gate with one animation loop.

**Little Robot Adventure.** Grid levels with Forward, Turn left, and Turn right. Turns are the robot's own left and right. `engine.ts` runs a whole program without any timing and returns every step. The screen then replays those steps slowly, so the result never depends on animation. Bumping a rock or the edge names the command to fix. The plan has Undo, Clear, Reset robot, and Hint (Hint compares the plan with the stored solution). There are nine levels, three per difficulty. Champion levels add a star to collect and a command limit. Tests check that every level is solvable within its limit.

**Puzzle Planet.** A bundled picture is cut into 4, 6, or 12 pieces with CSS background positioning, so there is no image-slicing code and nothing loads from the network. Pieces can be dragged, or tapped and then their space tapped. The keyboard works too (Enter on a piece). Pieces snap into their own space only and then lock. Undo takes the last piece back. A faint picture helper can be switched off, and it is off by default at Champion level.

**My Photo Puzzle.** The Puzzle Planet board (`puzzle-planet/PuzzleBoard.tsx`, shared by both games), using a family photo instead of a bundled picture.

- **Adding photos:** a grown-up adds or deletes photos after the existing parent check. They come from the device's own picture picker; the app requests no camera permission (the Android manifest removes it).
- **Processing (`photo-puzzle/photos.ts`):** the photo is checked (image types only, up to 25 MB), cropped to its centred square, and resized to 600 × 600. It is re-encoded as JPEG, which drops EXIF metadata such as GPS location. A real-browser test confirmed that a photo with GPS data is stored without it.
- **Storage:** up to 8 photos, each about 10 to 60 KB, are kept under `kids-learning-photos` in this app's local storage with an optional name that Pip reads out. They are never uploaded. Damaged or non-JPEG entries are ignored when loading.
- **Deleting:** a grown-up can delete photos one at a time or all at once, and Reset All Progress deletes them too.
- **Playing:** a photo is shown through a short-lived object URL so the pieces share one image.

**Shadow Detective.** The silhouette is the same bundled picture with a CSS `brightness(0)` filter, so its shape and proportions always match the answer. Items are hand-picked so outlines are distinct, and round look-alikes such as apple, orange, and ball are left out. Choices are 2, 4, and 4 by level, with two shadows at once at Champion. Wrong picks are greyed out without penalty, and the round is always 3 stars.

**Sound Safari.** The app has no recorded audio files, so it does not pretend to. It has two clearly labelled modes:

- **Music Studio sounds**: piano, drum, guitar, flute, and clapping, played by the same on-device synthesiser that Music Studio uses (`services/audio.ts`). They are labelled as made by the app, not recorded.
- **Animal sounds, said by Pip**: the narrator voice says "Moo!", "Woof!", and so on. The screen says Pip is pretending.

Vehicle and everyday sounds are left out because no real recordings exist (see Limitations). Each mode is disabled, with a note for parents, when its sound or speech is off or unavailable. Sounds that are easy to confuse (piano and guitar, drum and clap) only appear together at Champion level. Replaying cancels the previous phrase, so sounds never pile up.

**Rhythm Hero.** Pads use the Music Studio drum (kick), clap, and xylophone sounds. Beginner has 2 or 3 drum beats. Explorer has 4 to 6 beats with drum and clap. Champion has 5 to 8 beats with all three sounds and half-beat gaps. **Practice** checks only the order. **Keep the beat** also checks the gap between taps, within max(minimum, ratio × expected gap): 320 ms or 60% at Beginner, 240 ms or 45% at Explorer, 190 ms or 38% at Champion. Only gaps matter, so a child can start whenever they are ready. Pads light up during playback, so the game works with sound off. Keys 1, 2, and 3 play the pads.

**Little Chef.** Four pretend recipes (`recipes.ts`). Step text is generated from the recipe data, so the numbers said and shown always match it. Only the ingredient a step needs goes in, never more than it asks for. **Take one out** removes the last item from the current step. Beginners get a small pantry with the needed food highlighted and a "Tap me!" label. Champion hides the picture in the instruction. No step involves knives, heat, hot drinks, or appliances, and a test checks the text for those words. The game makes no nutrition or allergy claims and asks for no dietary information.

**Emotion Explorer.** Beginner matches faces. Explorer uses short stories about animal characters. Champion has open questions where every answer is welcomed and the child is asked how they would feel. Story questions list every feeling that fits (`accepted`) and only clearly unfitting distractors. A "not quite" answer gets "Good thinking! Most friends would feel …", never "wrong". Hard feelings bring a gentle reminder that all feelings are okay and that a trusted grown-up can help. The game only saves that a round was finished, never which feelings were picked.

**Space Explorer.** Four stops: the Moon, Mars, Saturn, and Planet Zoomy, a labelled make-believe planet. Each stop is three questions (counting stars, finding letters, spotting Saturn and adding rockets, finding shapes) shown with the existing `QuestionCard`. Finishing a stop opens the next one. Every stop can be replayed. Real places get a short, simple fact marked "True space fact". Planet Zoomy is marked "Make-believe".

## Progress and achievements

The progress object in `kids-learning-progress` has two fields for games:

- `gameRounds: Record<gameId, number>`: finished rounds. `completeGameRound(gameId, levelId?)` also adds to the existing `gamesCompleted`.
- `gameLevels: Record<gameId, string[]>`: unique things finished, each stored once. Examples: robot level ids, `puzzle` picture-size ids, recipe ids, space stops, and letters traced (`recordGameLevel`).

Older saved progress without these fields loads with empty maps. Damaged entries are dropped on load (`cleanGameRounds` and `cleanGameLevels` in `services/storage.ts`). Reset in Parent Settings clears them along with the rest of the progress.

`addWordLearned` and `addAnimalDiscovered` now ignore names that are not in the app's word or animal lists. Without that, games could inflate the learning totals.

New badges, defined in `data/achievements.ts`:

- **Letter Tracer**: 10 different letters traced.
- **Robot Coder**: 3 robot levels.
- **Little Chef**: every recipe made.
- **Space Explorer**: every stop visited.
- **Game Adventurer**: a round finished in 5 of the 10 new games.

Badge rules count only real level ids, so a damaged or unknown id never unlocks a badge.

## Tests

- Logic: `*/engine.test.ts`, `tracing.test.ts`, `rhythm.test.ts`, `sounds.test.ts`, `recipes.test.ts`, `scenarios.test.ts`, and `destinations.test.ts`.
- Store, storage, and badges: `learning-games/gameProgress.test.ts`.
- Browser: `e2e/number-racer.spec.ts` drives a whole race on a fake clock, plus a gentle miss with the glowing gate, and keyboard steering with Pause.
- Screens: `learning-games/games.integration.test.tsx`. It renders every route from `App`, checks hub discovery, and plays each game's main interaction, including pointer tracing, robot runs with fake timers, tap and keyboard puzzle placement, and the rhythm copy.

## Limitations

- Sound Safari has no real animal, vehicle, or everyday recordings. Adding them needs licensed audio files. Add each one as a new `SoundSource` kind and keep the label honest.
- Rhythm Hero and Sound Safari instruments are synthesised, the same as Music Studio. They are not recorded instrument samples.
- Tracing judges path coverage only, not stroke order, direction, or letter quality.
- My Photo Puzzle was tested with file uploads in desktop Chromium. The Android WebView picture picker still needs checking on a real device. Some browsers cannot open HEIC photos; the game then asks for a JPEG or PNG.
- Speech depends on the voices installed on the device. Quality was not checked on a real tablet or phone.

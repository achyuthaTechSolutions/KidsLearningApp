# Telugu and Hindi review checklist for Story Time

All Telugu and Hindi text in Story Time was written for this app as a draft. None of it has been reviewed by a native speaker. Do not mark a language `native-reviewed` until a qualified reviewer has worked through this checklist and signed off the review sheet.

## What the reviewer gets

- **`story-review-sheet.csv`** (this folder). It has one row per string: interface words, learning goals, character names, then every story in reading order.
  - Columns: `key`, `context`, `en`, `te`, `te_verdict`, `te_notes`, `hi`, `hi_verdict`, `hi_notes`.
  - It opens in any spreadsheet app.
- **A device or browser running the app** with the language set to Telugu or Hindi. Text must be judged in place as well as in the sheet.
- **`REVIEW_STATUS.md`**, which shows how much text each story has.

Both files are generated from the story data by `npm test` (`src/features/stories/content/localization.test.ts`). If a story changes, the test fails until the files are regenerated with `npx vitest run src/features/stories/content/localization.test.ts -u`. This means the sheet never drifts from what children see.

## Who should review

- A native speaker of the language who reads and writes it every day.
- Ideally someone who has taught or written for children aged 3 to 9.
- One reviewer per language. A second reader for any string marked `unsure` is better still.

## Verdicts

Put one of these in `te_verdict` or `hi_verdict`:

| Verdict | Meaning |
| --- | --- |
| `ok` | Correct, natural, and right for the age. |
| `fix` | Wrong or unnatural. Write the corrected text in the notes column. |
| `unsure` | Needs a second opinion. Say why. |

## Check every string for

1. **Meaning.** It says the same thing as the English. Nothing is added, lost, or reversed. Pay special attention to answer options, hints, and explanations, because a mistranslated option can make a wrong answer look right.
2. **Numbers.** Every number matches the English. The tests already check digits, including Telugu and Devanagari digits and the Hindi "3-3" form. Also check number *words*, such as "two" or "రెండు", which the tests cannot see.
3. **Child level.** Short sentences and everyday words a child of the story's age would know. No formal or literary register unless the story needs it.
4. **Naturalness.** It reads like something a parent would say aloud, not like a translation.
5. **Maths terms.** Use the words used in early maths classrooms in Andhra Pradesh, Telangana, and the Hindi-speaking states. Examples: "more" and "fewer", "groups of", "in all", "how many more", "number line", "pattern", "bar graph".
6. **Names and respect.** Character names are written consistently (see the `character.*` rows). Address forms (నువ్వు and మీరు, तुम and आप) are consistent and suitable for talking to a child.
7. **Cultural fit.** Nothing is awkward, unkind, or stereotyped. The Monkey and the Crocodile story teaches about one character's actions, not about a kind of animal or person.
8. **Slots.** Text such as `{n}` or `{a}` stays exactly as written. The app fills it in with a number or a name. Check that the sentence still reads well with a real value, for example "Ages 3–5" or "Add one to Blue doves".
9. **Spelling and script.** Correct conjuncts and vowel signs. No stray English letters (the tests catch Latin letters, but not misspellings).

## Check in the app (once per language)

- **Rendering.** Open each story. Every conjunct and vowel sign is drawn correctly, with no boxes and no broken joins. The bundled fonts are Noto Sans Telugu and Noto Sans Devanagari.
- **Fit.** No word is cut off on a small phone (about 360 px wide) or on a tablet. Buttons, story cards, and the bar graph labels are the places most likely to overflow.
- **Switching language.** Change language in the middle of a story and in the middle of an activity. The same line or activity should stay on screen, and nothing should reset.
- **Voice (if the device has one).** Turn on Voice. If the device has a voice for the language, check that the reading is understandable. If it has none, check that the "no voice" message is clear.

## Signing off

1. Save the completed sheet as `story-review-<lang>-<YYYY-MM-DD>-<reviewer initials>.csv`. Keep it with the release records, not in this folder.
2. A developer applies every `fix`, then reruns `npm test`. This regenerates the sheet.
3. The reviewer checks the regenerated rows they changed.
4. Only then, for each story that has been fully reviewed, change that language in `translation` from `draft-needs-native-review` to `native-reviewed`. Also update the test `marks every Telugu and Hindi story as still needing native review` in the same change, and record the reviewer, date, and sheet name in `.ai/DECISIONS.md`.

## Current status

See `REVIEW_STATUS.md`. As of 2026-10-23, every story and the shared interface text are **draft, needing native review**, in both Telugu and Hindi.

import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../engine/types';
import { allTextEntries, numbersOf, placeholdersOf, reviewSheetCsv, reviewStatusMarkdown, textProblems } from './inventory';
import { allStories } from './library';

describe('Story Time text inventory', () => {
  const entries = allTextEntries();

  it('has unique keys', () => {
    const keys = entries.map((entry) => entry.key);
    expect(keys.length).toBe(new Set(keys).size);
  });

  it('has no missing text, mismatched slots or numbers, or wrong scripts in any language', () => {
    const problems = entries.flatMap((entry) => textProblems(entry).map((problem) => `${entry.key}: ${problem}`));
    expect(problems).toEqual([]);
  });

  it('finds the problems it is meant to find', () => {
    const check = (en: string, te: string, hi: string) => textProblems({ group: 'x', key: 'x', context: '', text: { en, te, hi } });
    expect(check('Ages {n}', 'వయసు', 'उम्र {n}')).toEqual(['te: slots none differ from English {n}']);
    expect(check('4 pebbles', 'గులకరాళ్లు ౩', 'कंकड़ ४')).toEqual(['te: numbers 3 differ from English 4']);
    expect(check('Hello', 'Hello', 'नमस्ते ')).toEqual(['te: no Telugu letters', 'te: contains Latin letters', 'te: same as English', 'hi: extra spaces']);
    expect(check('Pot', 'కుండ घड़ा', '')).toEqual(['te: contains the other Indic script', 'hi: missing']);
    expect(placeholdersOf('{a} and {n}')).toEqual(['{a}', '{n}']);
    expect(numbersOf('౧౨ and १० and 3')).toEqual(['10', '12', '3']);
    expect(numbersOf('3-3 के 4 समूह, 6 − 3 = 3')).toEqual(['3', '3', '3', '4', '6']);
  });

  it('marks every Telugu and Hindi story as still needing native review', () => {
    // Change this test only when a qualified reviewer has signed off a review sheet.
    for (const story of allStories) for (const lang of LANGUAGES) expect(story.translation[lang]).toBe(lang === 'en' ? 'source' : 'draft-needs-native-review');
  });

  it('keeps the review sheet and the status page in step with the stories', async () => {
    await expect(reviewSheetCsv(entries)).toMatchFileSnapshot('../../../../docs/localization/story-review-sheet.csv');
    await expect(reviewStatusMarkdown()).toMatchFileSnapshot('../../../../docs/localization/REVIEW_STATUS.md');
  });
});

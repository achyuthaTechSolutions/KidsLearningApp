import { describe, expect, it } from 'vitest';
import { emojiKey, illustrationFor } from './illustrations';
import { alphabetData, letterOrder } from './alphabet';
import { numberData } from './numbers';
import { animalData } from './animals';
import { vocabularyData, categoryEmojis } from './vocabulary';
import { achievementsList } from './achievements';
import { sections } from '../app/sections';

describe('Bundled illustrations', () => {
  it('normalizes the emoji variation selector', () => {
    expect(emojiKey('☀️')).toBe('2600');
    expect(emojiKey('☀')).toBe('2600');
    expect(emojiKey('🍎')).toBe('1f34e');
  });

  it('has an illustration for every letter, number, animal, word, category, badge, and section', () => {
    const groups: Record<string, string[]> = {
      letters: letterOrder.map((letter) => alphabetData[letter].emoji),
      numbers: numberData.map((n) => n.emoji),
      animals: animalData.map((a) => a.emoji),
      words: vocabularyData.map((v) => v.emoji),
      categories: Object.values(categoryEmojis),
      achievements: achievementsList.map((a) => a.emoji),
      sections: sections.map((s) => s.emoji),
    };
    for (const [group, emojis] of Object.entries(groups)) {
      const missing = emojis.filter((emoji) => !illustrationFor(emoji));
      expect(missing, `${group} without an illustration`).toEqual([]);
    }
  });

  it('returns nothing for plain text symbols, so the text is shown instead', () => {
    expect(illustrationFor('.')).toBeUndefined();
    expect(illustrationFor('⌫')).toBeUndefined();
  });
});

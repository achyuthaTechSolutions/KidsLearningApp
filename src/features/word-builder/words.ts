import { alphabetData, letterOrder } from '../../data/alphabet';
import { vocabularyData } from '../../data/vocabulary';

export interface SpellWord {
  word: string;
  emoji: string;
}

export interface LetterTile {
  id: number;
  letter: string;
}

export const WORDS_PER_ROUND = 5;
export const MIN_LETTERS = 3;
export const MAX_LETTERS = 5;

/** Short, single words made only of letters, so every tile is a letter a child can say. */
export const spellWords: SpellWord[] = (() => {
  const candidates = [
    ...letterOrder.map((letter) => ({ word: alphabetData[letter].word, emoji: alphabetData[letter].emoji })),
    ...vocabularyData.map((item) => ({ word: item.word, emoji: item.emoji })),
  ];
  const seen = new Set<string>();
  return candidates.filter(({ word }) => {
    const key = word.toUpperCase();
    if (seen.has(key) || !/^[A-Z]+$/.test(key) || key.length < MIN_LETTERS || key.length > MAX_LETTERS) return false;
    seen.add(key);
    return true;
  });
})();

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function pickSpellWords(count = WORDS_PER_ROUND, random: () => number = Math.random): SpellWord[] {
  // Shorter words first, so each round starts easy.
  return shuffle(spellWords, random)
    .slice(0, count)
    .sort((a, b) => a.word.length - b.word.length);
}

/** The word's letters in a mixed-up order that never spells the word already. */
export function scrambleTiles(word: string, random: () => number = Math.random): LetterTile[] {
  const letters = word.toUpperCase().split('');
  let mixed = shuffle(letters, random);
  for (let attempt = 0; attempt < 10 && mixed.join('') === letters.join(''); attempt += 1) {
    mixed = shuffle(letters, random);
  }
  if (mixed.join('') === letters.join('') && new Set(letters).size > 1) {
    mixed = [...letters.slice(1), letters[0]];
  }
  return mixed.map((letter, id) => ({ id, letter }));
}

/** Whether `letter` is the next one the word needs after `placed` letters. */
export function isNextLetter(word: string, placed: number, letter: string): boolean {
  return word.toUpperCase()[placed] === letter.toUpperCase();
}

export function spellOut(word: string): string {
  return `${word.toUpperCase().split('').join(', ')}. ${word}!`;
}

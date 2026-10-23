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

export const MIN_LETTERS = 3;
export const MAX_LETTERS = 6;
/** Recent words are not picked again straight away. */
const RECENT = 6;

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

/**
 * Word lengths for an endless level: 3 letters first, then 3–4, 4, 4–5, 5, 5–6, and
 * from level 13 mostly 6. Every length has plenty of words.
 */
export function wordLengthsFor(level: number): number[] {
  const step = Math.min(6, Math.ceil(Math.max(1, level) / 2) - 1);
  return [[3], [3, 4], [4], [4, 5], [5], [5, 6], [6]][step];
}

/** Extra letters that are not in the word, from level 7: one, then up to three. */
export function decoysFor(level: number): number {
  return level < 7 ? 0 : Math.min(3, 1 + Math.floor((level - 7) / 4));
}

/** A word for the level that was not one of the last few. */
export function pickWord(level: number, recent: string[] = [], random: () => number = Math.random): SpellWord {
  const lengths = wordLengthsFor(level);
  const fits = spellWords.filter((item) => lengths.includes(item.word.length));
  const fresh = fits.filter((item) => !recent.slice(-RECENT).includes(item.word));
  const pool = fresh.length > 0 ? fresh : fits;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/**
 * The word's letters in a mixed-up order that never spells the word already, plus
 * `decoys` letters that are not in the word, placed among them.
 */
export function scrambleTiles(word: string, random: () => number = Math.random, decoys = 0): LetterTile[] {
  const letters = word.toUpperCase().split('');
  let mixed = shuffle(letters, random);
  for (let attempt = 0; attempt < 10 && mixed.join('') === letters.join(''); attempt += 1) {
    mixed = shuffle(letters, random);
  }
  if (mixed.join('') === letters.join('') && new Set(letters).size > 1) {
    mixed = [...letters.slice(1), letters[0]];
  }
  const extras = shuffle(letterOrder.filter((letter) => !letters.includes(letter)), random).slice(0, decoys);
  for (const extra of extras) mixed.splice(Math.floor(random() * (mixed.length + 1)), 0, extra);
  return mixed.map((letter, id) => ({ id, letter }));
}

/** Whether `letter` is the next one the word needs after `placed` letters. */
export function isNextLetter(word: string, placed: number, letter: string): boolean {
  return word.toUpperCase()[placed] === letter.toUpperCase();
}

export function spellOut(word: string): string {
  return `${word.toUpperCase().split('').join(', ')}. ${word}!`;
}

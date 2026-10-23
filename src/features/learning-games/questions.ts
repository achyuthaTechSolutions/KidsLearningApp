import { alphabetData, letterOrder } from '../../data/alphabet';
import { animalData } from '../../data/animals';
import { numberData } from '../../data/numbers';
import { vocabularyData } from '../../data/vocabulary';
import type { VocabularyCategory } from '../../types';

export type QuizGameType = 'find-letter' | 'guess-animal' | 'count' | 'match' | 'listen' | 'odd-one-out' | 'pattern';

export interface QuizQuestion {
  type: QuizGameType;
  prompt: string;
  correctAnswer: string;
  options: string[];
  emoji?: string;
  spokenWord?: string;
  /** Picture for each answer option, keyed by the option text. */
  pictures?: Record<string, string>;
  /** Pictures shown in a row before the missing one, for "What comes next?". */
  sequence?: string[];
  /** Said and shown after the answer, to explain it. */
  explanation?: string;
}

export const LISTEN_PROMPT = 'Listen carefully and choose the word.';
export const REPLAY_WORD_LABEL = 'Replay the word';
export const ODD_ONE_OUT_PROMPT = 'Which one does not belong?';
export const PATTERN_PROMPT = 'What comes next?';

const categoryNames: Record<VocabularyCategory, string> = {
  fruits: 'fruits',
  vegetables: 'vegetables',
  food: 'food',
  vehicles: 'vehicles',
  colors: 'colours',
  shapes: 'shapes',
  body: 'body parts',
  household: 'things at home',
  nature: 'things in nature',
};

/** Words that sit in one category only, so the odd one out is never ambiguous. */
const uniqueWords = vocabularyData.filter(
  (item) => vocabularyData.filter((other) => other.word === item.word).length === 1,
);

/** Patterns as positions in a repeating unit, e.g. ABAB, AABB, ABC. */
const patternShapes = [
  [0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 1, 0, 1, 1, 0],
  [0, 1, 2, 0, 1, 2, 0, 1],
];

const patternPictures = [
  ...animalData.map((animal) => ({ name: animal.name, emoji: animal.emoji })),
  ...uniqueWords
    .filter((item) => ['fruits', 'vehicles', 'shapes', 'nature'].includes(item.category))
    .map((item) => ({ name: item.word, emoji: item.emoji })),
];

/** The pattern each shape continues with, so tests can check the answer. */
export function nextInShape(shape: number[]): number {
  const period = Math.max(...shape) + 1;
  for (let length = period; length <= shape.length; length += 1) {
    const unit = shape.slice(0, length);
    if (shape.every((value, index) => value === unit[index % length])) return unit[shape.length % length];
  }
  return shape[0];
}

export const DAILY_GAME_TYPES: QuizGameType[] = [
  'find-letter',
  'guess-animal',
  'count',
  'match',
  'listen',
];

function pickIndex(length: number, random: () => number): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, random);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateQuestion(type: QuizGameType, random: () => number = Math.random): QuizQuestion {
  if (type === 'find-letter') {
    const letter = letterOrder[pickIndex(letterOrder.length, random)];
    const content = alphabetData[letter];
    const wrong = shuffle(letterOrder.filter((item) => item !== letter), random).slice(0, 3);
    return {
      type,
      prompt: `Which letter makes the "${content.phonetic}" sound?`,
      correctAnswer: letter,
      options: shuffle([letter, ...wrong], random),
      emoji: content.emoji,
    };
  }

  if (type === 'guess-animal') {
    const animal = animalData[pickIndex(animalData.length, random)];
    const wrong = shuffle(animalData.filter((item) => item.name !== animal.name), random)
      .slice(0, 3)
      .map((item) => item.name);
    return {
      type,
      prompt: `Which animal says "${animal.sound}"?`,
      correctAnswer: animal.name,
      options: shuffle([animal.name, ...wrong], random),
      emoji: animal.emoji,
    };
  }

  if (type === 'count') {
    const value = pickIndex(10, random) + 1;
    const content = numberData[value];
    const wrong = shuffle(
      Array.from({ length: 10 }, (_, index) => index + 1).filter((item) => item !== value),
      random,
    ).slice(0, 3);
    return {
      type,
      prompt: `How many ${content.objects} do you see? ${content.emoji.repeat(value)}`,
      correctAnswer: String(value),
      options: shuffle([String(value), ...wrong.map(String)], random),
      emoji: content.emoji,
    };
  }

  if (type === 'match') {
    const letter = letterOrder[pickIndex(letterOrder.length, random)];
    const content = alphabetData[letter];
    const wrong = shuffle(letterOrder.filter((item) => item !== letter), random)
      .slice(0, 3)
      .map((item) => alphabetData[item].word);
    return {
      type,
      prompt: `Which word starts with the letter ${letter}?`,
      correctAnswer: content.word,
      options: shuffle([content.word, ...wrong], random),
      emoji: content.emoji,
    };
  }

  if (type === 'odd-one-out') {
    const categories = [...new Set(uniqueWords.map((item) => item.category))]
      .filter((category) => uniqueWords.filter((item) => item.category === category).length >= 3);
    const group = categories[pickIndex(categories.length, random)];
    const same = shuffle(uniqueWords.filter((item) => item.category === group), random).slice(0, 3);
    const others = uniqueWords.filter((item) => item.category !== group);
    const odd = others[pickIndex(others.length, random)];
    const items = shuffle([...same, odd], random);
    return {
      type,
      prompt: ODD_ONE_OUT_PROMPT,
      correctAnswer: odd.word,
      options: items.map((item) => item.word),
      pictures: Object.fromEntries(items.map((item) => [item.word, item.emoji])),
      explanation: `The others are ${categoryNames[group]}.`,
    };
  }

  if (type === 'pattern') {
    const shape = patternShapes[pickIndex(patternShapes.length, random)];
    const period = Math.max(...shape) + 1;
    const chosen = shuffle(patternPictures, random);
    const used = chosen.slice(0, period);
    const extra = chosen.slice(period, period + Math.max(1, 4 - period));
    const answer = used[nextInShape(shape)];
    const options = shuffle([...used, ...extra], random);
    return {
      type,
      prompt: PATTERN_PROMPT,
      correctAnswer: answer.name,
      options: options.map((item) => item.name),
      pictures: Object.fromEntries(options.map((item) => [item.name, item.emoji])),
      sequence: shape.map((index) => used[index].emoji),
    };
  }

  const letter = letterOrder[pickIndex(letterOrder.length, random)];
  const content = alphabetData[letter];
  const wrong = shuffle(letterOrder.filter((item) => item !== letter), random)
    .slice(0, 3)
    .map((item) => alphabetData[item].word);
  return {
    type: 'listen',
    prompt: LISTEN_PROMPT,
    correctAnswer: content.word,
    options: shuffle([content.word, ...wrong], random),
    spokenWord: content.word,
  };
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDailyQuestions(dateKey: string): QuizQuestion[] {
  const random = mulberry32(hashString(`kids-daily-v1:${dateKey}`));
  return DAILY_GAME_TYPES.map((type) => generateQuestion(type, random));
}

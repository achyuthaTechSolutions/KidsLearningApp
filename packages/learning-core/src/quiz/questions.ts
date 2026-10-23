import { alphabetData, letterOrder } from '../content/alphabet';
import { animalData } from '../content/animals';
import { numberData } from '../content/numbers';

export type QuizGameType = 'find-letter' | 'guess-animal' | 'count' | 'match' | 'listen';

export interface QuizQuestion {
  type: QuizGameType;
  prompt: string;
  correctAnswer: string;
  options: string[];
  emoji?: string;
  spokenWord?: string;
}

export const LISTEN_PROMPT = 'Listen carefully and choose the word.';
export const REPLAY_WORD_LABEL = 'Replay the word';

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

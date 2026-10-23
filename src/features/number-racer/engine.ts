import type { GameDifficulty } from '../learning-games/difficulty';
import { pick, pickIndex, shuffle, type Random } from '../learning-games/random';

export const LANES = 3;

export type RaceQuestion =
  | { kind: 'find'; answer: number }
  | { kind: 'count'; answer: number; emoji: string }
  | { kind: 'add'; a: number; b: number; answer: number }
  | { kind: 'subtract'; a: number; b: number; answer: number }
  | { kind: 'missing'; a: number; total: number; answer: number };

export interface RaceGate {
  question: RaceQuestion;
  /** One answer per lane, left to right. */
  answers: number[];
  /** Lane of the right answer. */
  correctLane: number;
}

export interface RaceProfile {
  /** Seconds a gate takes to drive down to the car. Kept slow on purpose. */
  gateSeconds: number;
  /** The car slows after a miss, so the next try is gentler. */
  slowAfterMiss: number;
}

export const raceProfiles: Record<GameDifficulty, RaceProfile> = {
  beginner: { gateSeconds: 8, slowAfterMiss: 1.25 },
  intermediate: { gateSeconds: 6.5, slowAfterMiss: 1.2 },
  advanced: { gateSeconds: 5.5, slowAfterMiss: 1.2 },
};

export const RACE_LENGTHS = [5, 10] as const;
export const DEFAULT_RACE_LENGTH = 10;
/** Where the car sits on the road, as a share of the road's height from the top. */
export const CAR_LINE = 0.74;

const countEmoji = ['🍎', '⭐', '🎈', '🐟', '🌸'];

/** A question that fits the level. Every answer is a whole number from 0 to 20. */
export function createQuestion(difficulty: GameDifficulty, random: Random = Math.random): RaceQuestion {
  if (difficulty === 'beginner') {
    const answer = 1 + pickIndex(5, random);
    return random() < 0.5 ? { kind: 'find', answer } : { kind: 'count', answer, emoji: pick(countEmoji, random) };
  }
  const limit = difficulty === 'intermediate' ? 10 : 20;
  const roll = random();
  if (difficulty === 'advanced' && roll < 0.3) {
    const total = 5 + pickIndex(limit - 4, random);
    const a = 1 + pickIndex(total - 1, random);
    return { kind: 'missing', a, total, answer: total - a };
  }
  if (roll < 0.65) {
    const answer = 2 + pickIndex(limit - 1, random);
    const a = 1 + pickIndex(answer - 1, random);
    return { kind: 'add', a, b: answer - a, answer };
  }
  const a = 2 + pickIndex(limit - 1, random);
  const b = 1 + pickIndex(a - 1, random);
  return { kind: 'subtract', a, b, answer: a - b };
}

/** Three different answers near the right one, never below zero, in shuffled lanes. */
export function createGate(question: RaceQuestion, random: Random = Math.random): RaceGate {
  const near = shuffle([-3, -2, -1, 1, 2, 3].map((offset) => question.answer + offset).filter((value) => value >= 0), random);
  const answers = shuffle([question.answer, near[0], near[1]], random);
  return { question, answers, correctLane: answers.indexOf(question.answer) };
}

export function questionText(question: RaceQuestion): string {
  switch (question.kind) {
    case 'find': return `Drive to ${question.answer}`;
    case 'count': return 'How many?';
    case 'add': return `${question.a} + ${question.b} = ?`;
    case 'subtract': return `${question.a} − ${question.b} = ?`;
    case 'missing': return `${question.a} + ? = ${question.total}`;
  }
}

export function questionSpoken(question: RaceQuestion): string {
  switch (question.kind) {
    case 'find': return `Drive to the number ${question.answer}!`;
    case 'count': return 'Count them. Drive to the right number!';
    case 'add': return `What is ${question.a} plus ${question.b}?`;
    case 'subtract': return `What is ${question.a} take away ${question.b}?`;
    case 'missing': return `${question.a} plus what makes ${question.total}?`;
  }
}

/** Says why the answer is right, after a gate. */
export function explanation(question: RaceQuestion): string {
  switch (question.kind) {
    case 'find': return `That is ${question.answer}!`;
    case 'count': return `There are ${question.answer}.`;
    case 'add': return `${question.a} + ${question.b} = ${question.answer}.`;
    case 'subtract': return `${question.a} − ${question.b} = ${question.answer}.`;
    case 'missing': return `${question.a} + ${question.answer} = ${question.total}.`;
  }
}

export interface Race {
  difficulty: GameDifficulty;
  length: number;
  /** Gates passed correctly so far. */
  passed: number;
  gate: RaceGate;
  /** Misses on the current gate. After two, the right gate glows. */
  misses: number;
  firstTry: number;
  /** 1 is normal; above 1 the next gate drives more slowly. */
  slow: number;
  finished: boolean;
}

export function createRace(difficulty: GameDifficulty, length: number = DEFAULT_RACE_LENGTH, random: Random = Math.random): Race {
  return { difficulty, length, passed: 0, gate: createGate(createQuestion(difficulty, random), random), misses: 0, firstTry: 0, slow: 1, finished: false };
}

export type GateResult = 'right' | 'wrong';

/**
 * The car reached the gate in `lane`. A right answer moves on to a new question; a
 * wrong one keeps the same question, reshuffles the lanes, and slows the next gate.
 */
export function passGate(race: Race, lane: number, random: Random = Math.random): { race: Race; result: GateResult } {
  if (race.finished) return { race, result: 'wrong' };
  if (lane === race.gate.correctLane) {
    const passed = race.passed + 1;
    const finished = passed >= race.length;
    return {
      result: 'right',
      race: {
        ...race,
        passed,
        firstTry: race.firstTry + (race.misses === 0 ? 1 : 0),
        misses: 0,
        slow: 1,
        finished,
        gate: finished ? race.gate : createGate(nextQuestion(race, random), random),
      },
    };
  }
  return {
    result: 'wrong',
    race: { ...race, misses: race.misses + 1, slow: raceProfiles[race.difficulty].slowAfterMiss, gate: createGate(race.gate.question, random) },
  };
}

/** A new question, not the same as the one just answered. */
function nextQuestion(race: Race, random: Random): RaceQuestion {
  for (let i = 0; i < 10; i++) {
    const question = createQuestion(race.difficulty, random);
    if (questionText(question) !== questionText(race.gate.question) || question.answer !== race.gate.question.answer) return question;
  }
  return createQuestion(race.difficulty, random);
}

/** How far down the road a gate is, 0 (top) to CAR_LINE (at the car), after `seconds`. */
export function gateY(seconds: number, race: Race, reduced = false): number {
  const duration = raceProfiles[race.difficulty].gateSeconds * race.slow * (reduced ? 1.3 : 1);
  return Math.min(CAR_LINE, (Math.max(0, seconds) / duration) * CAR_LINE);
}

export function raceStars(race: Race): number {
  const ratio = race.firstTry / race.length;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

/** Moves the car one lane, staying on the road. */
export function steer(lane: number, direction: -1 | 1): number {
  return Math.min(LANES - 1, Math.max(0, lane + direction));
}

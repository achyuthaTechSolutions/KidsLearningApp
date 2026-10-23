import { bandOf, grow } from '../learning-games/adaptive';
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

/**
 * Seconds a gate takes to drive down to the car at a level: 8 at level 1, a little
 * quicker each level, never quicker than 3.5. Kept slow on purpose.
 */
export function gateSeconds(level: number): number {
  return grow(level, 8, -0.4, 3.5);
}

/** The car slows after a miss, so the next try is gentler. */
export const SLOW_AFTER_MISS = 1.25;

/** Where the car sits on the road, as a share of the road's height from the top. */
export const CAR_LINE = 0.74;

const countEmoji = ['🍎', '⭐', '🎈', '🐟', '🌸'];

/**
 * A question for an endless level. Levels 1–3 find or count (up to 3, 4, then 5).
 * Levels 4–6 add and take away within 6, 8, then 10. From level 7 sums grow by 2 a
 * level up to 20, and from level 8 there are missing numbers too.
 */
export function createQuestion(level: number, random: Random = Math.random): RaceQuestion {
  const band = bandOf(level);
  if (band === 'beginner') {
    const answer = 1 + pickIndex(grow(level, 3, 1, 5), random);
    return random() < 0.5 ? { kind: 'find', answer } : { kind: 'count', answer, emoji: pick(countEmoji, random) };
  }
  const limit = band === 'intermediate' ? grow(level - 3, 6, 2, 10) : grow(level - 6, 12, 2, 20);
  const roll = random();
  if (level >= 8 && roll < 0.3) {
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

/** An endless race: gates keep coming until the child stops. */
export interface Race {
  /** The endless level the next gate is made for. */
  level: number;
  /** Gates passed so far. */
  passed: number;
  gate: RaceGate;
  /** Misses on the current gate. After two, the right gate glows. */
  misses: number;
  firstTry: number;
  /** 1 is normal; above 1 the gate drives more slowly. */
  slow: number;
}

export function createRace(level: number, random: Random = Math.random): Race {
  return { level, passed: 0, gate: createGate(createQuestion(level, random), random), misses: 0, firstTry: 0, slow: 1 };
}

export type GateResult = 'right' | 'wrong';

/**
 * The car reached the gate in `lane`. A right answer moves on to a new question at
 * `nextLevel` (the level after this answer); a wrong one keeps the question,
 * reshuffles the lanes, and slows the gate. `firstTry` says whether a right answer
 * came without a miss, for the endless level.
 */
export function passGate(race: Race, lane: number, nextLevel = race.level, random: Random = Math.random): { race: Race; result: GateResult; firstTry: boolean } {
  if (lane === race.gate.correctLane) {
    const firstTry = race.misses === 0;
    return {
      result: 'right',
      firstTry,
      race: {
        ...race,
        level: nextLevel,
        passed: race.passed + 1,
        firstTry: race.firstTry + (firstTry ? 1 : 0),
        misses: 0,
        slow: 1,
        gate: createGate(nextQuestion(race.gate.question, nextLevel, random), random),
      },
    };
  }
  return {
    result: 'wrong',
    firstTry: false,
    race: { ...race, misses: race.misses + 1, slow: SLOW_AFTER_MISS, gate: createGate(race.gate.question, random) },
  };
}

/** A new question, not the same as the one just answered. */
function nextQuestion(previous: RaceQuestion, level: number, random: Random): RaceQuestion {
  for (let i = 0; i < 10; i++) {
    const question = createQuestion(level, random);
    if (questionText(question) !== questionText(previous) || question.answer !== previous.answer) return question;
  }
  return createQuestion(level, random);
}

/** How far down the road a gate is, 0 (top) to CAR_LINE (at the car), after `seconds`. */
export function gateY(seconds: number, race: Race, reduced = false): number {
  const duration = gateSeconds(race.level) * race.slow * (reduced ? 1.3 : 1);
  return Math.min(CAR_LINE, (Math.max(0, seconds) / duration) * CAR_LINE);
}

/** Stars when the child stops: first-try answers out of all gates passed. */
export function raceStars(race: Race): number {
  if (race.passed === 0) return 1;
  const ratio = race.firstTry / race.passed;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

/** Moves the car one lane, staying on the road. */
export function steer(lane: number, direction: -1 | 1): number {
  return Math.min(LANES - 1, Math.max(0, lane + direction));
}

import type {
  ArithmeticActivity, BarGraphActivity, EqualGroupsActivity, GraphQuestion, NumberLineActivity,
  PatternActivity, PebblePotActivity, QuestionActivity, SequenceActivity,
} from './types';

/*
 * The single source of truth for every answer. Screens animate these values;
 * they never work an answer out from what is drawn.
 */

// Pebble pot. A teaching model, not a fluid simulation: each pebble raises the
// water by a fixed step, so children can count the steps and predict the next one.
export function waterLevel(activity: PebblePotActivity, pebbles: number): number {
  const count = Math.max(0, Math.floor(pebbles));
  return Math.min(activity.maxLevel, activity.startLevel + activity.risePerPebble * count);
}

export function pebblesNeeded(activity: PebblePotActivity): number {
  return Math.max(0, Math.ceil((activity.drinkLevel - activity.startLevel) / activity.risePerPebble));
}

export function canDrink(activity: PebblePotActivity, pebbles: number): boolean {
  return waterLevel(activity, pebbles) >= activity.drinkLevel;
}

/** How many more pebbles are needed after `predictAfter` have gone in. */
export function predictionAnswer(activity: PebblePotActivity): number {
  return pebblesNeeded(activity) - activity.predictAfter;
}

export function arithmeticAnswer(activity: ArithmeticActivity): number {
  return activity.op === 'add' ? activity.a + activity.b : activity.a - activity.b;
}

export function numberLineTarget(activity: NumberLineActivity): number {
  return activity.start + activity.steps;
}

/** Moves the marker by one step, never past the ends of the line. */
export function moveOnLine(activity: NumberLineActivity, position: number, delta: number): number {
  return Math.min(activity.max, Math.max(activity.min, position + delta));
}

export function equalGroupsTotal(activity: EqualGroupsActivity): number {
  return activity.groups * activity.perGroup;
}

export function patternShown(activity: PatternActivity): string[] {
  return Array.from({ length: activity.shown }, (_, i) => activity.unit[i % activity.unit.length]);
}

export function patternAnswer(activity: PatternActivity): string {
  return activity.unit[activity.shown % activity.unit.length];
}

/** True when `id` is the next event in the story's order after the ones already placed. */
export function isNextEvent(activity: SequenceActivity, placed: string[], id: string): boolean {
  return activity.events[placed.length]?.id === id;
}

export function graphAnswer(activity: BarGraphActivity, question: GraphQuestion): string {
  const values = activity.categories.map((category) => category.value);
  if (question.kind === 'most') return activity.categories[values.indexOf(Math.max(...values))].id;
  if (question.kind === 'least') return activity.categories[values.indexOf(Math.min(...values))].id;
  const a = activity.categories.find((category) => category.id === question.a)?.value ?? 0;
  const b = activity.categories.find((category) => category.id === question.b)?.value ?? 0;
  return String(Math.abs(a - b));
}

/** Choices for a "difference" question: the answer plus nearby numbers, never negative. */
export function differenceChoices(answer: number): number[] {
  const set = new Set([answer, answer + 1, Math.max(0, answer - 1), answer + 2]);
  return [...set].sort((x, y) => x - y).slice(0, 3);
}

/** Adds one item to a bar while building the graph, never above its real count. */
export function addToBar(activity: BarGraphActivity, built: Record<string, number>, id: string): Record<string, number> {
  const category = activity.categories.find((item) => item.id === id);
  if (!category) return built;
  return { ...built, [id]: Math.min(category.value, (built[id] ?? 0) + 1) };
}

export function graphBuilt(activity: BarGraphActivity, built: Record<string, number>): boolean {
  return activity.categories.every((category) => (built[category.id] ?? 0) === category.value);
}

export function isCorrectOption(activity: QuestionActivity, optionId: string): boolean {
  return activity.correct.includes(optionId);
}

/*
 * Attempts, hints, and demonstrations, shared by every activity.
 * After one miss the hint shows; after two, "Show me" demonstrates the answer.
 * Once solved, further taps are ignored so one success is recorded once.
 */
export const HINT_AFTER_MISSES = 1;
export const DEMO_AFTER_MISSES = 2;

export interface Attempt {
  tries: number;
  misses: number;
  hintShown: boolean;
  demoShown: boolean;
  solved: boolean;
  /** Solved on the first try, with no hint or demonstration. */
  clean: boolean;
}

export const freshAttempt: Attempt = { tries: 0, misses: 0, hintShown: false, demoShown: false, solved: false, clean: false };

export function recordTry(attempt: Attempt, correct: boolean): Attempt {
  if (attempt.solved) return attempt;
  const tries = attempt.tries + 1;
  if (correct) return { ...attempt, tries, solved: true, clean: tries === 1 && !attempt.hintShown && !attempt.demoShown };
  const misses = attempt.misses + 1;
  return { ...attempt, tries, misses, hintShown: attempt.hintShown || misses >= HINT_AFTER_MISSES };
}

export function askHint(attempt: Attempt): Attempt {
  return attempt.solved ? attempt : { ...attempt, hintShown: true };
}

export function showDemo(attempt: Attempt): Attempt {
  return attempt.solved ? attempt : { ...attempt, demoShown: true, hintShown: true };
}

export function canShowDemo(attempt: Attempt): boolean {
  return !attempt.solved && attempt.misses >= DEMO_AFTER_MISSES;
}

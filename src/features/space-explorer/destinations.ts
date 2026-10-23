import type { GameDifficulty } from '../learning-games/difficulty';
import type { QuizQuestion } from '../learning-games/questions';
import { shuffle, type Random } from '../learning-games/random';

export type ActivityKind = 'count-stars' | 'letters' | 'planets-and-sums' | 'shapes';

export interface Destination {
  id: string;
  name: string;
  emoji: string;
  /** Real places get a checked, simple fact. Make-believe places say so. */
  real: boolean;
  fact: string;
  activity: ActivityKind;
  activityTitle: string;
}

export const destinations: Destination[] = [
  {
    id: 'moon', name: 'The Moon', emoji: '🌙', real: true, activity: 'count-stars', activityTitle: 'Count the stars',
    fact: 'The Moon travels around our Earth. Astronauts have walked on it and left footprints in its dust.',
  },
  {
    id: 'mars', name: 'Mars', emoji: '🔴', real: true, activity: 'letters', activityTitle: 'Find the letters of MARS',
    fact: 'Mars is called the red planet because its dusty, rocky ground looks reddish.',
  },
  {
    id: 'saturn', name: 'Saturn', emoji: '🪐', real: true, activity: 'planets-and-sums', activityTitle: 'Spot Saturn and add up rockets',
    fact: 'Saturn has wide, bright rings made of pieces of ice and rock.',
  },
  {
    id: 'zoomy', name: 'Planet Zoomy', emoji: '🛸', real: false, activity: 'shapes', activityTitle: 'Find the shapes',
    fact: 'Planet Zoomy is a make-believe planet, just for this game. Its friends love shapes!',
  },
];

export const QUESTIONS_PER_STOP = 3;

/** The first place is always open. Each next place opens when the one before it is visited. */
export function isUnlocked(index: number, visited: string[]): boolean {
  if (index <= 0) return true;
  return visited.includes(destinations[index - 1].id);
}

export function nextDestination(visited: string[]): Destination | undefined {
  return destinations.find((destination, index) => isUnlocked(index, visited) && !visited.includes(destination.id));
}

const maxStars: Record<GameDifficulty, number> = { beginner: 5, intermediate: 8, advanced: 10 };
const maxSum: Record<GameDifficulty, number> = { beginner: 4, intermediate: 7, advanced: 10 };

function choicesAround(answer: number, max: number, count: number, random: Random): string[] {
  const near = Array.from({ length: max }, (_, i) => i + 1).filter((value) => value !== answer);
  return shuffle([answer, ...shuffle(near, random).slice(0, count - 1)].map(String), random);
}

function optionCount(difficulty: GameDifficulty): number {
  return difficulty === 'beginner' ? 3 : 4;
}

const spaceBodies = [
  { name: 'Saturn', emoji: '🪐' },
  { name: 'Earth', emoji: '🌍' },
  { name: 'Moon', emoji: '🌙' },
  { name: 'Sun', emoji: '☀️' },
];

const shapes = [
  { name: 'Triangle', emoji: '🔺' },
  { name: 'Circle', emoji: '⭕' },
  { name: 'Square', emoji: '⬜' },
  { name: 'Star', emoji: '⭐' },
];

/** Three short questions for a stop, built from the app's letter, number, and shape content. */
export function buildActivity(destination: Destination, difficulty: GameDifficulty, random: Random = Math.random): QuizQuestion[] {
  const count = optionCount(difficulty);
  if (destination.activity === 'count-stars') {
    const values = shuffle(Array.from({ length: maxStars[difficulty] - 1 }, (_, i) => i + 2), random).slice(0, QUESTIONS_PER_STOP);
    return values.map((value) => ({
      type: 'count',
      prompt: `How many stars do you see? ${'⭐'.repeat(value)}`,
      correctAnswer: String(value),
      options: choicesAround(value, maxStars[difficulty], count, random),
      emoji: '⭐',
    }));
  }
  if (destination.activity === 'letters') {
    return ['M', 'A', 'R'].map((letter) => {
      const others = shuffle('BCDEFGHIJKLNOPQSTUVWXYZ'.split(''), random).slice(0, count - 1);
      return {
        type: 'find-letter',
        prompt: `Mars starts M, A, R. Find the letter ${letter}!`,
        correctAnswer: letter,
        options: shuffle([letter, ...others], random),
      };
    });
  }
  if (destination.activity === 'planets-and-sums') {
    const bodies = shuffle(spaceBodies, random).slice(0, count);
    if (!bodies.some((body) => body.name === 'Saturn')) bodies[0] = spaceBodies[0];
    const spotSaturn: QuizQuestion = {
      type: 'match',
      prompt: 'Which one is Saturn, the planet with rings?',
      correctAnswer: 'Saturn',
      options: shuffle(bodies, random).map((body) => body.name),
      pictures: Object.fromEntries(bodies.map((body) => [body.name, body.emoji])),
      explanation: destination.fact,
    };
    const sums = Array.from({ length: QUESTIONS_PER_STOP - 1 }, () => {
      const total = 2 + Math.floor(random() * (maxSum[difficulty] - 1));
      const a = 1 + Math.floor(random() * (total - 1));
      const b = total - a;
      return {
        type: 'match' as const,
        prompt: `Rockets ready! ${a} + ${b} = ?`,
        correctAnswer: String(total),
        options: choicesAround(total, Math.max(maxSum[difficulty], count + 1), count, random),
        sequence: [...Array(a).fill('🚀'), '➕', ...Array(b).fill('🚀')],
      };
    });
    return [spotSaturn, ...sums];
  }
  return shuffle(shapes, random).slice(0, QUESTIONS_PER_STOP).map((target) => {
    const options = shuffle([target, ...shuffle(shapes.filter((shape) => shape !== target), random).slice(0, count - 1)], random);
    return {
      type: 'match',
      prompt: `Zoomy friends want the ${target.name.toLowerCase()}. Can you find it?`,
      correctAnswer: target.name,
      options: options.map((shape) => shape.name),
      pictures: Object.fromEntries(options.map((shape) => [shape.name, shape.emoji])),
    };
  });
}

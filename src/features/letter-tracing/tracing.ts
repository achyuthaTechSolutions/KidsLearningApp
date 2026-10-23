import { letterOrder } from '../../data/alphabet';
import { shuffle } from '../learning-games/random';
import { strokesFor, type Point, type Stroke } from './strokes';

/**
 * How tracing is judged (this is coverage, not handwriting recognition):
 * 1. Each guide stroke is sampled every SAMPLE_STEP units.
 * 2. A sample is "covered" when any drawn point is within TOLERANCE units of it.
 * 3. A letter is complete when every stroke is at least STROKE_COVERAGE covered
 *    and at least INK_ACCURACY of the drawn points stay near the guide, so
 *    scribbling over the whole box does not count.
 * Stroke order and direction are shown as guidance but are not enforced.
 */
export const SAMPLE_STEP = 3;
export const TOLERANCE = 10;
export const STROKE_COVERAGE = 0.75;
export const INK_ACCURACY = 0.6;
/** Ink this far from the guide counts as off the path. */
const INK_DISTANCE = TOLERANCE * 1.8;

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** Younger children get a wider path and a lower bar; advanced asks for a little more care. */
export const tracingTolerance: Record<Difficulty, { tolerance: number; coverage: number; accuracy: number }> = {
  beginner: { tolerance: 13, coverage: 0.7, accuracy: 0.5 },
  intermediate: { tolerance: TOLERANCE, coverage: STROKE_COVERAGE, accuracy: INK_ACCURACY },
  advanced: { tolerance: 8, coverage: 0.8, accuracy: 0.65 },
};

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Evenly spaced points along a stroke, including both ends. */
export function sampleStroke(stroke: Stroke, step = SAMPLE_STEP): Point[] {
  if (stroke.length === 0) return [];
  const samples: Point[] = [stroke[0]];
  let carry = 0;
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1];
    const b = stroke[i];
    const length = distance(a, b);
    let travelled = step - carry;
    while (travelled <= length) {
      const t = travelled / length;
      samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      travelled += step;
    }
    carry = length - (travelled - step);
  }
  const last = stroke[stroke.length - 1];
  if (distance(samples[samples.length - 1], last) > 0.5) samples.push(last);
  return samples;
}

export interface TraceScore {
  /** Covered fraction for each guide stroke, 0 to 1. */
  strokes: number[];
  /** Fraction of drawn points near the guide, 0 to 1 (1 when nothing is drawn). */
  accuracy: number;
  complete: boolean;
}

export function scoreTrace(letter: string, drawn: Point[][], difficulty: Difficulty = 'intermediate'): TraceScore {
  const rules = tracingTolerance[difficulty];
  const guide = strokesFor(letter);
  const ink = drawn.flat();
  const samplesPerStroke = guide.map((stroke) => sampleStroke(stroke));
  const strokes = samplesPerStroke.map((samples) => {
    if (samples.length === 0) return 0;
    const covered = samples.filter((sample) => ink.some((point) => distance(point, sample) <= rules.tolerance)).length;
    return covered / samples.length;
  });
  const allSamples = samplesPerStroke.flat();
  const near = ink.filter((point) => allSamples.some((sample) => distance(point, sample) <= INK_DISTANCE)).length;
  const accuracy = ink.length === 0 ? 1 : near / ink.length;
  const complete = guide.length > 0 && ink.length > 0
    && strokes.every((value) => value >= rules.coverage)
    && accuracy >= rules.accuracy;
  return { strokes, accuracy, complete };
}

/** Maps a pointer position to the 0–100 tracing box, whatever size the box is drawn at. */
export function toBoxPoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): Point {
  const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
  const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 100;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
}

/** Skips points closer than `min` to the previous one, which keeps long traces light. */
export function appendPoint(points: Point[], next: Point, min = 1.2): Point[] {
  const last = points[points.length - 1];
  if (last && distance(last, next) < min) return points;
  return [...points, next];
}

export const LETTERS_PER_ROUND = 5;

export type LetterCase = 'upper' | 'lower' | 'both';
export type Order = 'next' | 'surprise';

/** Letters for one round: the next ones not yet traced, or a random set. */
export function pickTracingLetters(letterCase: LetterCase, order: Order, traced: readonly string[], random: () => number = Math.random): string[] {
  const forms = letterOrder.flatMap((letter) => {
    if (letterCase === 'upper') return [letter];
    if (letterCase === 'lower') return [letter.toLowerCase()];
    return [letter, letter.toLowerCase()];
  });
  if (order === 'surprise') return shuffle(forms, random).slice(0, LETTERS_PER_ROUND);
  const untraced = forms.filter((letter) => !traced.includes(letter));
  const pool = untraced.length >= LETTERS_PER_ROUND ? untraced : forms;
  return pool.slice(0, LETTERS_PER_ROUND);
}


export interface StartMarker {
  point: Point;
  /** Direction of the first move, in degrees, for the little arrow. */
  angle: number;
  number: number;
}

/**
 * Where to draw each stroke's numbered start dot. When a stroke starts where an earlier
 * one did (like the two sides of A), its dot moves a little way along its own path, so
 * dot 1 is never hidden under dot 2.
 */
export function startMarkers(strokes: Stroke[]): StartMarker[] {
  const placed: Point[] = [];
  return strokes.map((stroke, i) => {
    const samples = sampleStroke(stroke, 3);
    const crowded = placed.some((other) => distance(other, stroke[0]) < 8);
    const point = crowded ? samples[Math.min(samples.length - 1, 4)] : stroke[0];
    const after = samples[Math.min(samples.length - 1, samples.indexOf(point) + 1)] ?? point;
    placed.push(point);
    return { point, angle: (Math.atan2(after.y - point.y, after.x - point.x) * 180) / Math.PI, number: i + 1 };
  });
}

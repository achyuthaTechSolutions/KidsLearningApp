import { describe, expect, it } from 'vitest';
import { letterOrder } from '../../data/alphabet';
import { lowercaseStrokes, strokesFor, uppercaseStrokes } from './strokes';
import { appendPoint, sampleStroke, scoreTrace, startMarkers, toBoxPoint } from './tracing';

const all = [...letterOrder, ...letterOrder.map((letter) => letter.toLowerCase())];

describe('Letter tracing guides', () => {
  it('has strokes for every uppercase and lowercase letter, inside the box', () => {
    expect(Object.keys(uppercaseStrokes)).toHaveLength(26);
    expect(Object.keys(lowercaseStrokes)).toHaveLength(26);
    for (const letter of all) {
      const strokes = strokesFor(letter);
      expect(strokes.length, letter).toBeGreaterThan(0);
      for (const point of strokes.flat()) {
        expect(point.x, letter).toBeGreaterThanOrEqual(0);
        expect(point.x, letter).toBeLessThanOrEqual(100);
        expect(point.y, letter).toBeGreaterThanOrEqual(0);
        expect(point.y, letter).toBeLessThanOrEqual(100);
      }
    }
  });

  it('samples a stroke evenly from start to end', () => {
    const samples = sampleStroke([{ x: 0, y: 0 }, { x: 30, y: 0 }], 3);
    expect(samples[0]).toEqual({ x: 0, y: 0 });
    expect(samples[samples.length - 1].x).toBeCloseTo(30);
    expect(samples).toHaveLength(11);
  });
});

describe('Tracing score', () => {
  it('completes every letter when the guide itself is traced', () => {
    for (const letter of all) {
      const drawn = strokesFor(letter).map((stroke) => sampleStroke(stroke, 2));
      expect(scoreTrace(letter, drawn, 'advanced').complete, letter).toBe(true);
    }
  });

  it('does not complete with nothing drawn or with one stroke missing', () => {
    expect(scoreTrace('A', []).complete).toBe(false);
    const partial = strokesFor('A').slice(0, 2).map((stroke) => sampleStroke(stroke, 2));
    const score = scoreTrace('A', partial);
    expect(score.complete).toBe(false);
    expect(score.strokes[2]).toBeLessThan(0.75);
  });

  it('does not reward scribbling over the whole box', () => {
    const scribble = [];
    for (let y = 0; y <= 100; y += 4) for (let x = 0; x <= 100; x += 4) scribble.push({ x, y });
    const score = scoreTrace('L', [scribble]);
    expect(score.accuracy).toBeLessThan(0.6);
    expect(score.complete).toBe(false);
  });

  it('allows a slightly wobbly trace', () => {
    const wobbly = strokesFor('T').map((stroke) => sampleStroke(stroke, 2).map((p, i) => ({ x: p.x + (i % 2 ? 4 : -4), y: p.y + (i % 3 ? 3 : -3) })));
    expect(scoreTrace('T', wobbly, 'beginner').complete).toBe(true);
  });
});

describe('Pointer mapping', () => {
  it('maps screen positions into the 0 to 100 box at any size', () => {
    const rect = { left: 10, top: 20, width: 400, height: 400 };
    expect(toBoxPoint(210, 220, rect)).toEqual({ x: 50, y: 50 });
    expect(toBoxPoint(0, 0, rect)).toEqual({ x: 0, y: 0 });
    expect(toBoxPoint(9999, 9999, rect)).toEqual({ x: 100, y: 100 });
    expect(toBoxPoint(60, 70, { left: 10, top: 20, width: 100, height: 100 })).toEqual({ x: 50, y: 50 });
  });

  it('skips tiny pointer moves', () => {
    const start = [{ x: 10, y: 10 }];
    expect(appendPoint(start, { x: 10.5, y: 10 })).toBe(start);
    expect(appendPoint(start, { x: 14, y: 10 })).toHaveLength(2);
  });
});

describe('Start dots', () => {
  it('never stacks two numbered dots on the same spot', () => {
    for (const letter of all) {
      const markers = startMarkers(strokesFor(letter));
      for (let i = 0; i < markers.length; i++) {
        for (let j = 0; j < i; j++) {
          expect(Math.hypot(markers[i].point.x - markers[j].point.x, markers[i].point.y - markers[j].point.y), `${letter} ${i}`).toBeGreaterThanOrEqual(6);
        }
      }
    }
  });
});

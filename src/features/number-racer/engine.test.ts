import { describe, expect, it } from 'vitest';
import {
  CAR_LINE, LANES, SLOW_AFTER_MISS, createGate, createQuestion, createRace, explanation, gateSeconds, gateY, passGate, questionText, raceStars, steer, type RaceQuestion,
} from './engine';

const seeded = (seed = 1) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const sumSize = (question: RaceQuestion) => (question.kind === 'add' ? question.a + question.b : question.kind === 'subtract' ? question.a : question.kind === 'missing' ? question.total : question.answer);

describe('Number Racer questions', () => {
  it('grow with the level: find and count first, then sums that get bigger', () => {
    const random = seeded(3);
    for (let i = 0; i < 400; i++) {
      for (const [level, kinds, max] of [[1, ['find', 'count'], 3], [3, ['find', 'count'], 5], [4, ['add', 'subtract'], 6], [6, ['add', 'subtract'], 10], [7, ['add', 'subtract'], 12]] as const) {
        const question = createQuestion(level, random);
        expect(kinds as readonly string[], `level ${level}`).toContain(question.kind);
        expect(question.answer, `level ${level}`).toBeGreaterThanOrEqual(1);
        expect(sumSize(question), `level ${level}`).toBeLessThanOrEqual(max);
      }
    }
  });

  it('never go past 20, however high the level, and add missing numbers from level 8', () => {
    const random = seeded(7);
    const kinds = new Set<string>();
    for (let i = 0; i < 400; i++) {
      for (const level of [8, 12, 50, 999]) {
        const question = createQuestion(level, random);
        kinds.add(question.kind);
        expect(sumSize(question)).toBeLessThanOrEqual(20);
        expect(question.answer).toBeGreaterThanOrEqual(1);
        if (question.kind === 'add') expect(question.a + question.b).toBe(question.answer);
        if (question.kind === 'subtract') expect(question.a - question.b).toBe(question.answer);
        if (question.kind === 'missing') expect(question.a + question.answer).toBe(question.total);
      }
    }
    expect([...kinds].sort()).toEqual(['add', 'missing', 'subtract']);
    for (let i = 0; i < 200; i++) expect(createQuestion(7, random).kind).not.toBe('missing');
  });

  it('show the sum and explain the answer', () => {
    const add: RaceQuestion = { kind: 'add', a: 3, b: 4, answer: 7 };
    expect(questionText(add)).toBe('3 + 4 = ?');
    expect(explanation(add)).toBe('3 + 4 = 7.');
    expect(questionText({ kind: 'missing', a: 4, total: 9, answer: 5 })).toBe('4 + ? = 9');
    expect(questionText({ kind: 'subtract', a: 9, b: 2, answer: 7 })).toBe('9 − 2 = ?');
    expect(questionText({ kind: 'count', answer: 3, emoji: '🍎' })).toBe('How many?');
  });
});

describe('Gates', () => {
  it('have three different answers, the right one in its lane, none below zero', () => {
    const random = seeded(11);
    for (const answer of [0, 1, 2, 5, 19, 20]) {
      for (let i = 0; i < 50; i++) {
        const gate = createGate({ kind: 'find', answer }, random);
        expect(gate.answers).toHaveLength(LANES);
        expect(new Set(gate.answers).size).toBe(LANES);
        expect(gate.answers[gate.correctLane]).toBe(answer);
        expect(gate.answers.every((value) => value >= 0)).toBe(true);
      }
    }
  });

  it('put the right answer in every lane over time', () => {
    const random = seeded(5);
    const lanes = new Set(Array.from({ length: 60 }, () => createGate({ kind: 'find', answer: 4 }, random).correctLane));
    expect([...lanes].sort()).toEqual([0, 1, 2]);
  });

  it('come faster as the level rises, but never too fast', () => {
    expect(gateSeconds(1)).toBe(8);
    expect(gateSeconds(2)).toBeCloseTo(7.6);
    expect(gateSeconds(100)).toBe(3.5);
  });
});

describe('An endless race', () => {
  it('keeps going, counts gates and first tries, and uses the next level for new gates', () => {
    const random = seeded(2);
    let race = createRace(1, random);
    for (let i = 0; i < 12; i++) {
      const step = passGate(race, race.gate.correctLane, 1 + i, random);
      expect(step.firstTry).toBe(true);
      race = step.race;
    }
    expect(race.passed).toBe(12);
    expect(race.firstTry).toBe(12);
    expect(race.level).toBe(12);
    expect(raceStars(race)).toBe(3);
  });

  it('keeps the question after a miss, slows down, and reports the answer as not first try', () => {
    const random = seeded(9);
    const race = createRace(5, random);
    const wrongLane = (race.gate.correctLane + 1) % LANES;
    const miss = passGate(race, wrongLane, race.level, random);
    expect(miss.result).toBe('wrong');
    expect(miss.race.gate.question).toEqual(race.gate.question);
    expect(miss.race.misses).toBe(1);
    expect(miss.race.slow).toBe(SLOW_AFTER_MISS);
    const fixed = passGate(miss.race, miss.race.gate.correctLane, miss.race.level, random);
    expect(fixed.result).toBe('right');
    expect(fixed.firstTry).toBe(false);
    expect(fixed.race.passed).toBe(1);
    expect(fixed.race.slow).toBe(1);
  });

  it('gives stars for the share of first tries, and one star for stopping straight away', () => {
    const random = seeded(4);
    let race = createRace(4, random);
    expect(raceStars(race)).toBe(1);
    for (let i = 0; i < 4; i++) {
      if (i < 3) race = passGate(race, (race.gate.correctLane + 1) % LANES, race.level, random).race;
      race = passGate(race, race.gate.correctLane, race.level, random).race;
    }
    expect(race.firstTry).toBe(1);
    expect(raceStars(race)).toBe(1);
  });

  it('drives gates down slowly, stopping at the car', () => {
    const race = createRace(1, seeded(1));
    expect(gateY(0, race)).toBe(0);
    expect(gateY(4, race)).toBeCloseTo(CAR_LINE / 2);
    expect(gateY(100, race)).toBe(CAR_LINE);
    expect(gateY(4, race, true)).toBeLessThan(gateY(4, race));
    expect(gateY(4, { ...race, slow: 1.25 })).toBeLessThan(gateY(4, race));
    expect(gateY(4, { ...race, level: 10 })).toBeGreaterThan(gateY(4, race));
  });

  it('steers between the three lanes without leaving the road', () => {
    expect(steer(0, -1)).toBe(0);
    expect(steer(0, 1)).toBe(1);
    expect(steer(2, 1)).toBe(2);
  });
});

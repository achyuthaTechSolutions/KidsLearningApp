import { describe, expect, it } from 'vitest';
import {
  CAR_LINE, LANES, createGate, createQuestion, createRace, explanation, gateY, passGate, questionText, raceStars, steer, type RaceQuestion,
} from './engine';

const seeded = (seed = 1) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

describe('Number Racer questions', () => {
  it('fit each level: up to 5, within 10, and within 20', () => {
    const random = seeded(3);
    for (let i = 0; i < 500; i++) {
      const easy = createQuestion('beginner', random);
      expect(['find', 'count']).toContain(easy.kind);
      expect(easy.answer).toBeGreaterThanOrEqual(1);
      expect(easy.answer).toBeLessThanOrEqual(5);
      const middle = createQuestion('intermediate', random);
      expect(['add', 'subtract']).toContain(middle.kind);
      expect(middle.answer).toBeGreaterThanOrEqual(1);
      expect(middle.kind === 'add' ? middle.a + middle.b : middle.kind === 'subtract' ? middle.a : 0).toBeLessThanOrEqual(10);
      const hard = createQuestion('advanced', random);
      expect(hard.answer).toBeGreaterThanOrEqual(1);
      expect(hard.answer).toBeLessThanOrEqual(20);
    }
  });

  it('always have a correct answer that matches the sum', () => {
    const random = seeded(7);
    for (let i = 0; i < 500; i++) {
      const question = createQuestion('advanced', random);
      if (question.kind === 'add') expect(question.a + question.b).toBe(question.answer);
      if (question.kind === 'subtract') expect(question.a - question.b).toBe(question.answer);
      if (question.kind === 'missing') expect(question.a + question.answer).toBe(question.total);
    }
  });

  it('show the sum and explain the answer', () => {
    const add: RaceQuestion = { kind: 'add', a: 3, b: 4, answer: 7 };
    expect(questionText(add)).toBe('3 + 4 = ?');
    expect(explanation(add)).toBe('3 + 4 = 7.');
    expect(questionText({ kind: 'missing', a: 4, total: 9, answer: 5 })).toBe('4 + ? = 9');
    expect(questionText({ kind: 'subtract', a: 9, b: 2, answer: 7 })).toBe('9 − 2 = ?');
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
});

describe('A race', () => {
  it('counts right answers, finishes after the last gate, and gives stars for first tries', () => {
    const random = seeded(2);
    let race = createRace('beginner', 5, random);
    for (let i = 0; i < 5; i++) race = passGate(race, race.gate.correctLane, random).race;
    expect(race.finished).toBe(true);
    expect(race.passed).toBe(5);
    expect(race.firstTry).toBe(5);
    expect(raceStars(race)).toBe(3);
  });

  it('keeps the question after a miss, slows down, and never ends the race', () => {
    const random = seeded(9);
    const race = createRace('intermediate', 5, random);
    const wrongLane = (race.gate.correctLane + 1) % LANES;
    const { race: after, result } = passGate(race, wrongLane, random);
    expect(result).toBe('wrong');
    expect(after.gate.question).toEqual(race.gate.question);
    expect(after.misses).toBe(1);
    expect(after.slow).toBeGreaterThan(1);
    expect(after.finished).toBe(false);
    const { race: fixed } = passGate(after, after.gate.correctLane, random);
    expect(fixed.passed).toBe(1);
    expect(fixed.firstTry).toBe(0);
    expect(fixed.slow).toBe(1);
  });

  it('gives fewer stars when many answers took more than one try', () => {
    const random = seeded(4);
    let race = createRace('advanced', 4, random);
    for (let i = 0; i < 4; i++) {
      if (i < 3) race = passGate(race, (race.gate.correctLane + 1) % LANES, random).race;
      race = passGate(race, race.gate.correctLane, random).race;
    }
    expect(race.firstTry).toBe(1);
    expect(raceStars(race)).toBe(1);
  });

  it('drives gates down slowly, stopping at the car', () => {
    const race = createRace('beginner', 5, seeded(1));
    expect(gateY(0, race)).toBe(0);
    expect(gateY(4, race)).toBeCloseTo(CAR_LINE / 2);
    expect(gateY(100, race)).toBe(CAR_LINE);
    expect(gateY(4, race, true)).toBeLessThan(gateY(4, race));
    expect(gateY(4, { ...race, slow: 1.25 })).toBeLessThan(gateY(4, race));
  });

  it('steers between the three lanes without leaving the road', () => {
    expect(steer(0, -1)).toBe(0);
    expect(steer(0, 1)).toBe(1);
    expect(steer(2, 1)).toBe(2);
  });
});

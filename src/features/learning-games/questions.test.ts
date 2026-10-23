import { describe, expect, it } from 'vitest';
import {
  DAILY_GAME_TYPES,
  LISTEN_PROMPT,
  REPLAY_WORD_LABEL,
  buildDailyQuestions,
  generateQuestion,
  mulberry32,
  nextInShape,
  ODD_ONE_OUT_PROMPT,
  PATTERN_PROMPT, quizLevel, STANDARD_QUIZ } from './questions';

describe('Listen and Choose questions', () => {
  it('keeps the target word out of the prompt', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const question = generateQuestion('listen', mulberry32(seed));
      expect(question.prompt).toBe(LISTEN_PROMPT);
      expect(question.prompt.toLowerCase()).not.toContain(question.correctAnswer.toLowerCase());
      expect(question.emoji).toBeUndefined();
      expect(question.spokenWord).toBe(question.correctAnswer);
      expect(question.options).toContain(question.correctAnswer);
      expect(REPLAY_WORD_LABEL.toLowerCase()).not.toContain(question.correctAnswer.toLowerCase());
    }
  });
});

describe('Daily question selection', () => {
  it('uses one question from each game and stays the same for a date', () => {
    const first = buildDailyQuestions('2026-10-22');
    const second = buildDailyQuestions('2026-10-22');
    expect(first).toEqual(second);
    expect(first.map((question) => question.type)).toEqual(DAILY_GAME_TYPES);
  });

  it('can select a different set on another date', () => {
    const today = buildDailyQuestions('2026-10-22');
    const tomorrow = buildDailyQuestions('2026-10-23');
    expect(tomorrow).not.toEqual(today);
  });

  it('does not put the listen answer in that question prompt', () => {
    const listen = buildDailyQuestions('2026-10-22').find((question) => question.type === 'listen');
    expect(listen?.prompt).toBe(LISTEN_PROMPT);
    expect(listen?.prompt.toLowerCase()).not.toContain(listen?.correctAnswer.toLowerCase() ?? 'missing');
    expect(listen?.emoji).toBeUndefined();
  });
});

describe('Odd One Out questions', () => {
  it('has one picture per option and an explained, unique answer', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const question = generateQuestion('odd-one-out', mulberry32(seed));
      expect(question.prompt).toBe(ODD_ONE_OUT_PROMPT);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.correctAnswer);
      for (const option of question.options) expect(question.pictures?.[option]).toBeTruthy();
      expect(question.explanation).toMatch(/^The others are /);
    }
  });
});

describe('What Comes Next questions', () => {
  it('continues the repeating unit', () => {
    expect(nextInShape([0, 1, 0, 1, 0])).toBe(1);
    expect(nextInShape([0, 0, 1, 0, 0, 1, 0, 0])).toBe(1);
    expect(nextInShape([0, 1, 1, 0, 1, 1, 0])).toBe(1);
    expect(nextInShape([0, 1, 2, 0, 1, 2, 0, 1])).toBe(2);
  });

  it('offers the picture that comes next', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const question = generateQuestion('pattern', mulberry32(seed));
      expect(question.prompt).toBe(PATTERN_PROMPT);
      expect(question.sequence?.length).toBeGreaterThanOrEqual(5);
      expect(question.options.length).toBeGreaterThanOrEqual(3);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options).toContain(question.correctAnswer);
      const answerPicture = question.pictures?.[question.correctAnswer];
      expect(question.sequence).toContain(answerPicture);
    }
  });
});

describe('Quiz levels', () => {
  const types = ['find-letter', 'guess-animal', 'count', 'match', 'listen', 'odd-one-out', 'pattern'] as const;

  it('grow: more choices, bigger counts, and longer patterns, each with a limit', () => {
    expect([1, 2, 3, 6, 7, 10, 11, 99].map((level) => quizLevel(level).options)).toEqual([3, 3, 4, 4, 5, 5, 6, 6]);
    expect(quizLevel(1).countMax).toBe(5);
    expect(quizLevel(99).countMax).toBe(20);
    expect(quizLevel(1).shapes).toBe(1);
    expect(quizLevel(99).shapes).toBeLessThanOrEqual(STANDARD_QUIZ.shapes);
  });

  it('make fair questions for every game at every level: the right number of different choices, one right answer', () => {
    for (const type of types) {
      for (const level of [1, 3, 7, 11, 50]) {
        const random = mulberry32(level * 31 + type.length);
        for (let i = 0; i < 150; i += 1) {
          const question = generateQuestion(type, random, quizLevel(level));
          const expected = type === 'pattern' ? question.options.length : quizLevel(level).options;
          expect(question.options, `${type} level ${level}`).toHaveLength(expected);
          expect(question.options.length).toBeGreaterThanOrEqual(3);
          expect(new Set(question.options).size, `${type} level ${level}`).toBe(question.options.length);
          expect(question.options).toContain(question.correctAnswer);
          if (type === 'count') expect(Number(question.correctAnswer)).toBeLessThanOrEqual(quizLevel(level).countMax);
        }
      }
    }
  });
});

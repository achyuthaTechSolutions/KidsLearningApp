import { describe, expect, it } from 'vitest';
import {
  DAILY_GAME_TYPES,
  LISTEN_PROMPT,
  REPLAY_WORD_LABEL,
  buildDailyQuestions,
  generateQuestion,
  mulberry32,
} from './questions';

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

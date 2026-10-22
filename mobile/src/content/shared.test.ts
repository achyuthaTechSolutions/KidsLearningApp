import { buildDailyQuestions, letterOrder, LISTEN_PROMPT, numberData } from '@kids/learning-core';

describe('shared learning content', () => {
  it('keeps the listen answer out of the prompt and counts every number', () => {
    const questions = buildDailyQuestions('2026-10-22');
    const listen = questions.find((question) => question.type === 'listen');
    expect(letterOrder).toHaveLength(26);
    expect(numberData).toHaveLength(21);
    expect(listen?.prompt).toBe(LISTEN_PROMPT);
    expect(listen?.prompt.toLowerCase()).not.toContain(listen?.correctAnswer.toLowerCase() ?? 'missing');
  });
});
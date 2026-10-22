import { describe, expect, it } from 'vitest';
import { createParentChallenge, isParentAnswer } from './parentChallenge';

describe('Parent gate', () => {
  it('builds a stable addition question', () => {
    const challenge = createParentChallenge(() => 0);
    expect(challenge.prompt).toBe('What is 6 + 4?');
    expect(challenge.answer).toBe(10);
  });

  it('accepts only the matching whole number', () => {
    const challenge = createParentChallenge(() => 0);
    expect(isParentAnswer(challenge, ' 10 ')).toBe(true);
    expect(isParentAnswer(challenge, '11')).toBe(false);
    expect(isParentAnswer(challenge, 'ten')).toBe(false);
    expect(isParentAnswer(challenge, '10abc')).toBe(false);
  });
});

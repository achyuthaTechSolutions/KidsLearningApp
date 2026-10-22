import { describe, expect, it } from 'vitest';
import { illustrationFor } from '../../data/illustrations';
import { mulberry32 } from '../learning-games/questions';
import { QUESTIONS_PER_STOP, buildActivity, destinations, isUnlocked, nextDestination } from './destinations';

describe('Space Explorer map', () => {
  it('opens places one at a time, in order', () => {
    expect(isUnlocked(0, [])).toBe(true);
    expect(isUnlocked(1, [])).toBe(false);
    expect(isUnlocked(1, ['moon'])).toBe(true);
    expect(isUnlocked(2, ['moon'])).toBe(false);
    expect(nextDestination([])?.id).toBe('moon');
    expect(nextDestination(['moon', 'mars'])?.id).toBe('saturn');
    expect(nextDestination(destinations.map((item) => item.id))).toBeUndefined();
  });

  it('marks make-believe places as not real, and uses bundled pictures', () => {
    expect(destinations.find((item) => item.id === 'zoomy')?.real).toBe(false);
    expect(destinations.find((item) => item.id === 'zoomy')?.fact).toMatch(/make-believe/);
    for (const item of destinations) expect(illustrationFor(item.emoji), item.id).toBeTruthy();
    expect(illustrationFor('➕')).toBeTruthy();
    expect(new Set(destinations.map((item) => item.id)).size).toBe(destinations.length);
  });
});

describe('Space Explorer activities', () => {
  it('builds valid questions for every stop and level', () => {
    for (const destination of destinations) {
      for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
        for (let seed = 1; seed <= 15; seed += 1) {
          const questions = buildActivity(destination, difficulty, mulberry32(seed));
          expect(questions, destination.id).toHaveLength(QUESTIONS_PER_STOP);
          for (const question of questions) {
            expect(question.options).toContain(question.correctAnswer);
            expect(new Set(question.options).size).toBe(question.options.length);
            expect(question.options.length).toBe(difficulty === 'beginner' ? 3 : 4);
            if (question.pictures) for (const option of question.options) expect(question.pictures[option]).toBeTruthy();
          }
        }
      }
    }
  });

  it('shows as many stars as the answer, and sums that add up', () => {
    const moon = buildActivity(destinations[0], 'intermediate', mulberry32(3));
    for (const question of moon) expect([...question.prompt.matchAll(/⭐/g)].length).toBe(Number(question.correctAnswer));
    const saturn = buildActivity(destinations[2], 'advanced', mulberry32(9));
    for (const question of saturn.slice(1)) {
      const [, a, b] = question.prompt.match(/(\d+) \+ (\d+)/)!;
      expect(Number(a) + Number(b)).toBe(Number(question.correctAnswer));
      expect(question.sequence?.filter((emoji) => emoji === '🚀')).toHaveLength(Number(question.correctAnswer));
    }
  });
});

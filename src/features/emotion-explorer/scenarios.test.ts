import { describe, expect, it } from 'vitest';
import { illustrationFor } from '../../data/illustrations';
import { mulberry32 } from '../learning-games/questions';
import {
  EMOTION_ROUNDS, buildEmotionRound, choicesFor, emotions, feedbackFor, judgeEmotion, kindFor, needsSupportTip, questionFor, scenarios,
} from './scenarios';

describe('Emotion scenarios', () => {
  it('are unique, pictured, and have enough of each kind for a round', () => {
    expect(new Set(scenarios.map((item) => item.id)).size).toBe(scenarios.length);
    for (const emotion of Object.values(emotions)) expect(illustrationFor(emotion.emoji)).toBeTruthy();
    for (const scenario of scenarios) expect(illustrationFor(scenario.character), scenario.id).toBeTruthy();
    for (const kind of ['face', 'story'] as const) expect(scenarios.filter((item) => item.kind === kind).length).toBeGreaterThanOrEqual(EMOTION_ROUNDS);
    expect(scenarios.filter((item) => item.kind === 'think').length).toBeGreaterThanOrEqual(4);
  });

  it('never lists a feeling as both fitting and not fitting', () => {
    for (const scenario of scenarios) {
      for (const emotion of scenario.distractors) expect(scenario.accepted, scenario.id).not.toContain(emotion);
      if (scenario.kind !== 'think') expect(scenario.distractors.length).toBeGreaterThanOrEqual(choicesFor.advanced - 1);
    }
  });
});

describe('Emotion questions', () => {
  it('always offers a fitting answer and the level number of choices', () => {
    for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
      for (let seed = 1; seed <= 20; seed += 1) {
        const round = buildEmotionRound(difficulty, mulberry32(seed));
        expect(round.length).toBeGreaterThan(0);
        for (const question of round) {
          expect(question.scenario.kind).toBe(kindFor[difficulty]);
          expect(question.choices).toHaveLength(choicesFor[difficulty]);
          expect(new Set(question.choices).size).toBe(question.choices.length);
          expect(question.choices.some((emotion) => question.scenario.accepted.includes(emotion))).toBe(true);
        }
      }
    }
  });

  it('gives story choices with exactly one fitting feeling, so the answer is fair', () => {
    for (const scenario of scenarios.filter((item) => item.kind !== 'think')) {
      const question = questionFor(scenario, 3, mulberry32(1));
      expect(question.choices.filter((emotion) => scenario.accepted.includes(emotion))).toHaveLength(1);
    }
  });

  it('accepts more than one feeling where more than one makes sense', () => {
    const gift = scenarios.find((item) => item.id === 'gift')!;
    expect(judgeEmotion(gift, 'happy')).toBe('fits');
    expect(judgeEmotion(gift, 'excited')).toBe('fits');
    expect(judgeEmotion(gift, 'sad')).toBe('not-quite');
  });

  it('welcomes every answer in discussion questions', () => {
    const think = scenarios.find((item) => item.kind === 'think')!;
    for (const emotion of Object.keys(emotions) as (keyof typeof emotions)[]) expect(judgeEmotion(think, emotion)).toBe('discuss');
  });

  it('keeps feedback kind, and offers grown-up support for hard feelings', () => {
    const lost = scenarios.find((item) => item.id === 'lost-toy')!;
    const text = feedbackFor(lost, 'happy');
    expect(text).toMatch(/^Good thinking!/);
    expect(text.toLowerCase()).not.toMatch(/wrong|bad|no!/);
    expect(needsSupportTip(lost, 'sad')).toBe(true);
    expect(needsSupportTip(scenarios.find((item) => item.id === 'helping')!, 'happy')).toBe(false);
  });
});

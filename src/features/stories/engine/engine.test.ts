import { describe, expect, it } from 'vitest';
import {
  askHint, canDrink, canShowDemo, freshAttempt, pebblesNeeded, predictionAnswer, recordTry, showDemo, waterLevel,
} from './activities';
import { phaseOf, playerReducer, resumePlayback, startPlayback, storyFraction, type PlayerAction } from './player';
import { canResume, emptyStoryProgress, isCompleted, recordActivity, savePlayback, summarizeObjectives, type LearningEvent } from './progress';
import { errorsOf, validateStory } from './validate';
import { storyValidationContext } from '../content/library';
import { thirstyCrow } from '../content/thirstyCrow';
import type { PebblePotActivity, StoryManifest } from './types';

const pebbleActivity = thirstyCrow.scenes.find((scene) => scene.id === 'pebbles')!.activity as PebblePotActivity;

/** Plays a story to the end, solving each activity and taking the first choice. */
export function playThrough(story: StoryManifest, pick: (sceneId: string) => string | undefined = () => undefined) {
  let playback = startPlayback(story, 'test-run');
  const visited: string[] = [];
  for (let guard = 0; guard < 500 && !playback.finished; guard += 1) {
    const phase = phaseOf(story, playback);
    const scene = story.scenes.find((item) => item.id === playback.sceneId)!;
    if (!visited.includes(scene.id)) visited.push(scene.id);
    let action: PlayerAction;
    if (phase === 'line') action = { type: 'next-line' };
    else if (phase === 'activity') action = { type: 'solve', activityId: scene.activity!.id };
    else if (phase === 'choice') action = { type: 'choose', choiceId: pick(scene.id) ?? scene.choices![0].id };
    else action = { type: 'continue' };
    playback = playerReducer(story, playback, action);
  }
  return { playback, visited };
}

describe('Pebble pot model', () => {
  it('raises the water one fixed step per pebble, never above the pot', () => {
    expect(waterLevel(pebbleActivity, 0)).toBe(2);
    expect(waterLevel(pebbleActivity, 3)).toBe(5);
    expect(waterLevel(pebbleActivity, 99)).toBe(8);
    expect(waterLevel(pebbleActivity, -2)).toBe(2);
  });

  it('knows when the crow can drink, and how many pebbles that takes', () => {
    expect(pebblesNeeded(pebbleActivity)).toBe(4);
    expect(canDrink(pebbleActivity, 3)).toBe(false);
    expect(canDrink(pebbleActivity, 4)).toBe(true);
    expect(predictionAnswer(pebbleActivity)).toBe(2);
  });

  it('keeps the story text in step with the numbers', () => {
    const counting = thirstyCrow.scenes.find((scene) => scene.id === 'drink')!.activity!;
    expect(counting.kind === 'count' && counting.count).toBe(pebblesNeeded(pebbleActivity));
    expect(pebbleActivity.explanation.en).toContain(`${predictionAnswer(pebbleActivity)} more pebbles`);
    for (const lang of ['te', 'hi'] as const) expect(pebbleActivity.explanation[lang]).toContain(String(predictionAnswer(pebbleActivity)));
  });
});

describe('Attempts, hints, and demonstrations', () => {
  it('shows a hint after one miss and offers a demonstration after two', () => {
    let attempt = recordTry(freshAttempt, false);
    expect(attempt.hintShown).toBe(true);
    expect(canShowDemo(attempt)).toBe(false);
    attempt = recordTry(attempt, false);
    expect(canShowDemo(attempt)).toBe(true);
    attempt = recordTry(showDemo(attempt), true);
    expect(attempt).toMatchObject({ solved: true, clean: false, demoShown: true, tries: 3 });
  });

  it('counts a first-try answer as clean, but not after asking for a hint', () => {
    expect(recordTry(freshAttempt, true).clean).toBe(true);
    expect(recordTry(askHint(freshAttempt), true).clean).toBe(false);
  });

  it('ignores taps after the answer is found', () => {
    const solved = recordTry(freshAttempt, true);
    expect(recordTry(solved, false)).toBe(solved);
  });
});

describe('Story player', () => {
  it('plays the Thirsty Crow from start to end', () => {
    const { playback, visited } = playThrough(thirstyCrow);
    expect(playback.finished).toBe(true);
    expect(visited).toEqual(thirstyCrow.scenes.map((scene) => scene.id));
    expect(storyFraction(thirstyCrow, playback)).toBe(1);
  });

  it('will not skip an activity or accept the wrong one', () => {
    let playback = startPlayback(thirstyCrow, 'r');
    playback = playerReducer(thirstyCrow, playback, { type: 'next-line' });
    playback = playerReducer(thirstyCrow, playback, { type: 'next-line' });
    playback = playerReducer(thirstyCrow, playback, { type: 'continue' });
    expect(playback.sceneId).toBe('the-pot');
    for (let i = 0; i < 2; i += 1) playback = playerReducer(thirstyCrow, playback, { type: 'next-line' });
    expect(phaseOf(thirstyCrow, playback)).toBe('activity');
    expect(playerReducer(thirstyCrow, playback, { type: 'continue' })).toBe(playback);
    expect(playerReducer(thirstyCrow, playback, { type: 'solve', activityId: 'count-pebbles' })).toBe(playback);
    playback = playerReducer(thirstyCrow, playback, { type: 'solve', activityId: 'can-reach' });
    expect(phaseOf(thirstyCrow, playback)).toBe('continue');
    expect(playerReducer(thirstyCrow, playback, { type: 'next-line' })).toBe(playback);
  });

  it('replays a scene without losing solved activities', () => {
    let playback = startPlayback(thirstyCrow, 'r');
    playback = { ...playback, sceneId: 'the-pot', lineIndex: 2, solvedActivities: ['can-reach'] };
    playback = playerReducer(thirstyCrow, playback, { type: 'replay-scene' });
    expect(playback.lineIndex).toBe(0);
    expect(playback.solvedActivities).toEqual(['can-reach']);
  });

  it('resumes a saved position, and restarts one from another version or a missing scene', () => {
    const saved = { ...startPlayback(thirstyCrow, 'r'), sceneId: 'drink', lineIndex: 1, completedScenes: ['hot-day', 'the-pot', 'pebbles'] };
    expect(resumePlayback(thirstyCrow, saved)).toEqual(saved);
    expect(resumePlayback(thirstyCrow, { ...saved, version: 0 }).sceneId).toBe('hot-day');
    expect(resumePlayback(thirstyCrow, { ...saved, sceneId: 'gone' }).sceneId).toBe('hot-day');
    expect(resumePlayback(thirstyCrow, { ...saved, lineIndex: 99 }).lineIndex).toBe(2);
  });
});

describe('Story progress', () => {
  it('counts a finished run once, and keeps the position when the language changes', () => {
    const { playback } = playThrough(thirstyCrow);
    let data = savePlayback(emptyStoryProgress, playback, 'en', 1);
    data = savePlayback(data, playback, 'te', 2);
    expect(data.stories['thirsty-crow'].completedRuns).toEqual(['test-run']);
    expect(data.stories['thirsty-crow'].lastLang).toBe('te');
    expect(isCompleted(data, 'thirsty-crow')).toBe(true);
    const halfway = { ...startPlayback(thirstyCrow, 'r2'), sceneId: 'pebbles', completedScenes: ['hot-day', 'the-pot'] };
    data = savePlayback(data, halfway, 'hi', 3);
    expect(canResume(data, thirstyCrow)).toBe(true);
    expect(data.stories['thirsty-crow'].playback?.sceneId).toBe('pebbles');
  });

  it('records each activity once per run', () => {
    const playback = startPlayback(thirstyCrow, 'run-a');
    const solved = recordTry(freshAttempt, true);
    let data = recordActivity(emptyStoryProgress, playback, pebbleActivity, solved, 1);
    data = recordActivity(data, playback, pebbleActivity, solved, 2);
    expect(data.events).toHaveLength(1);
    expect(recordActivity(data, playback, pebbleActivity, freshAttempt, 3)).toBe(data);
  });

  it('needs repeated clean success across activities before calling a skill mastered', () => {
    const event = (activityId: string, clean: boolean, extra: Partial<LearningEvent> = {}): LearningEvent => ({
      runId: activityId, storyId: 's', activityId, objectives: ['counting'], tries: clean ? 1 : 2, solved: true, clean, hint: !clean, demo: false, day: '2026-10-22', ...extra,
    });
    expect(summarizeObjectives([event('a', true)])[0].level).toBe('succeeding');
    expect(summarizeObjectives([event('a', true), event('a', true), event('a', true)])[0].level).toBe('succeeding');
    expect(summarizeObjectives([event('a', true), event('b', true), event('a', true)])[0].level).toBe('mastered');
    expect(summarizeObjectives([event('a', false)])[0].level).toBe('practising');
    const struggling = summarizeObjectives([event('a', false, { demo: true }), event('b', false, { tries: 4 })])[0];
    expect(struggling.needsPractice).toBe(true);
  });
});

describe('Content validation', () => {
  it('passes for the Thirsty Crow', () => {
    expect(errorsOf(validateStory(thirstyCrow, storyValidationContext))).toEqual([]);
  });

  it('catches broken stories', () => {
    const broken: StoryManifest = {
      ...thirstyCrow,
      version: 0,
      title: { ...thirstyCrow.title, te: '' },
      scenes: [
        { ...thirstyCrow.scenes[0], next: 'nowhere' },
        { ...thirstyCrow.scenes[1], characters: [{ id: 'dragon' as never, position: 'left' }] },
        { ...thirstyCrow.scenes[2], activity: { ...pebbleActivity, drinkLevel: 1 } },
        ...thirstyCrow.scenes.slice(3, -1),
        { ...thirstyCrow.scenes[thirstyCrow.scenes.length - 1], moral: undefined },
      ],
    };
    const codes = new Set(validateStory(broken, storyValidationContext).filter((issue) => issue.level === 'error').map((issue) => issue.code));
    for (const code of ['bad-version', 'missing-translation', 'bad-reference', 'bad-activity', 'unreachable-scene', 'missing-moral']) expect(codes, code).toContain(code);
  });

  it('catches missing pictures, narration, and unsupported activities', () => {
    const story: StoryManifest = {
      ...thirstyCrow,
      emoji: '🦄🦄',
      scenes: thirstyCrow.scenes.map((scene, i) => (i === 0
        ? { ...scene, lines: [{ ...scene.lines[0], audio: { te: 'narration/te/crow-1.mp3' } }], activity: { ...pebbleActivity, id: 'x', kind: 'dance' as never } }
        : scene)),
    };
    const codes = validateStory(story, storyValidationContext).map((issue) => issue.code);
    expect(codes).toContain('missing-asset');
    expect(codes).toContain('unsupported-activity');
  });
});

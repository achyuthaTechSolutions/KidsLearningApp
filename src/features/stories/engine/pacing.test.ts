import { describe, expect, it } from 'vitest';
import { allStories } from '../content/library';
import { autoStep, celebrateMs, readingTimeMs, speechTimeoutMs, type StoryMode } from './pacing';
import { phaseOf, playerReducer, startPlayback, type Playback } from './player';
import { errorsOf, validateStory } from './validate';
import { storyValidationContext } from '../content/library';

/** Plays a story the way the player does when nobody touches it. */
function autoPlay(storyId: string, mode: StoryMode) {
  const story = allStories.find((item) => item.id === storyId)!;
  let playback: Playback = startPlayback(story, 'run');
  const stops: string[] = [];
  for (let i = 0; i < 500 && !playback.finished; i++) {
    const phase = phaseOf(story, playback);
    const step = autoStep(story, playback, phase, mode);
    if (step.kind === 'wait-child') {
      // A child answers: solve the activity or take the first choice.
      stops.push(`${playback.sceneId}:${phase}`);
      const scene = story.scenes.find((item) => item.id === playback.sceneId)!;
      playback = phase === 'activity'
        ? playerReducer(story, playback, { type: 'solve', activityId: scene.activity!.id })
        : playerReducer(story, playback, { type: 'choose', choiceId: scene.choices![0].id });
      continue;
    }
    const action = step.kind === 'wait-line' ? { type: 'next-line' as const }
      : step.kind === 'skip-activity' ? { type: 'skip-activity' as const, activityId: step.activityId }
        : step.kind === 'choose' ? { type: 'choose' as const, choiceId: step.choiceId }
          : { type: 'continue' as const };
    playback = playerReducer(story, playback, action);
  }
  return { playback, stops };
}

describe('Story mode', () => {
  it('plays every story to the end without stopping, solving nothing', () => {
    for (const story of allStories) {
      const { playback, stops } = autoPlay(story.id, 'story');
      expect(playback.finished, story.id).toBe(true);
      expect(stops, story.id).toEqual([]);
      expect(playback.solvedActivities, story.id).toEqual([]);
      expect(playback.skippedActivities?.length, story.id).toBe(story.scenes.filter((scene) => scene.activity && playback.completedScenes.includes(scene.id)).length);
    }
  });

  it('takes the main choice at every branch', () => {
    for (const story of allStories) {
      const { playback } = autoPlay(story.id, 'story');
      for (const [sceneId, choiceId] of Object.entries(playback.choices)) {
        const scene = story.scenes.find((item) => item.id === sceneId)!;
        expect(scene.choices!.find((choice) => choice.id === choiceId)!.main, `${story.id}/${sceneId}`).toBe(true);
      }
    }
  });
});

describe('Puzzle mode', () => {
  it('stops only at activities and choices, and finishes once the child answers', () => {
    for (const story of allStories) {
      const { playback, stops } = autoPlay(story.id, 'puzzle');
      expect(playback.finished, story.id).toBe(true);
      expect(stops.length, story.id).toBeGreaterThan(0);
      expect(stops.every((stop) => /:(activity|choice)$/.test(stop)), story.id).toBe(true);
    }
  });

  it('stops at the Thirsty Crow activities in order', () => {
    expect(autoPlay('thirsty-crow', 'puzzle').stops).toEqual(['the-pot:activity', 'pebbles:activity', 'drink:activity', 'compare:activity', 'why:activity']);
  });
});

describe('Pacing', () => {
  it('gives longer lines more reading time, within limits', () => {
    expect(readingTimeMs('Caw!')).toBe(2500);
    expect(readingTimeMs('Kalu flew and flew. At last, he saw a pot under a tree.')).toBeGreaterThan(readingTimeMs('Caw! I am so thirsty.'));
    expect(readingTimeMs('x'.repeat(500))).toBe(9000);
    expect(readingTimeMs('x'.repeat(500), 0.5)).toBe(18000);
    expect(readingTimeMs('Caw!', 1.5)).toBe(1667);
  });

  it('counts Telugu and Hindi letters, not bytes', () => {
    const te = 'కాలూ ఎగిరి ఎగిరి వెళ్లాడు.';
    expect(readingTimeMs(te)).toBe(Math.max(2500, 1500 + [...te].length * 70));
  });

  it('never waits forever for speech, and leaves time to celebrate', () => {
    expect(speechTimeoutMs('Caw!')).toBe(11000);
    expect(celebrateMs('Yes')).toBe(3500);
  });
});

describe('Main choices', () => {
  it('are required, one per choice scene', () => {
    const story = structuredClone(allStories.find((item) => item.id === 'clever-rabbit')!);
    const scene = story.scenes.find((item) => item.choices)!;
    scene.choices = scene.choices!.map((choice) => ({ ...choice, main: undefined }));
    expect(errorsOf(validateStory(story, storyValidationContext)).map((issue) => issue.code)).toEqual(['bad-choice']);
    scene.choices = scene.choices.map((choice) => ({ ...choice, main: true }));
    expect(errorsOf(validateStory(story, storyValidationContext)).map((issue) => issue.code)).toEqual(['bad-choice']);
  });
});

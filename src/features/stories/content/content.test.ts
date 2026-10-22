import { describe, expect, it } from 'vitest';
import {
  arithmeticAnswer, equalGroupsTotal, graphAnswer, numberLineTarget, patternAnswer, pebblesNeeded, predictionAnswer,
} from '../engine/activities';
import { phaseOf, playerReducer, startPlayback, type Playback } from '../engine/player';
import { LANGUAGES, type StoryManifest } from '../engine/types';
import { errorsOf, validateStory } from '../engine/validate';
import { allStories, publishedStories, storiesForAge, storyValidationContext } from './library';
import { uiKeys, uiStrings } from './uiText';

/** Every path through a story, following each choice in turn. */
function allPaths(story: StoryManifest): { finished: Playback; scenes: string[] }[] {
  const results: { finished: Playback; scenes: string[] }[] = [];
  const walk = (playback: Playback, scenes: string[], depth: number) => {
    if (depth > 400) throw new Error(`${story.id}: story does not end`);
    if (playback.finished) {
      results.push({ finished: playback, scenes });
      return;
    }
    const scene = story.scenes.find((item) => item.id === playback.sceneId)!;
    const seen = scenes.includes(scene.id) ? scenes : [...scenes, scene.id];
    const phase = phaseOf(story, playback);
    if (phase === 'choice') {
      for (const choice of scene.choices!) walk(playerReducer(story, playback, { type: 'choose', choiceId: choice.id }), seen, depth + 1);
      return;
    }
    const action = phase === 'line' ? { type: 'next-line' as const } : phase === 'activity' ? { type: 'solve' as const, activityId: scene.activity!.id } : { type: 'continue' as const };
    const next = playerReducer(story, playback, action);
    if (next === playback) throw new Error(`${story.id}: stuck in ${scene.id} (${phase})`);
    walk(next, seen, depth + 1);
  };
  walk(startPlayback(story, 'path'), [], 0);
  return results;
}

describe('The five stories', () => {
  it('are all published, valid, and unique', () => {
    expect(allStories.map((story) => story.id)).toEqual(['thirsty-crow', 'clever-rabbit', 'lion-mouse', 'monkey-crocodile', 'cooperative-doves']);
    for (const story of allStories) expect(errorsOf(validateStory(story, storyValidationContext)), story.id).toEqual([]);
    expect(publishedStories()).toHaveLength(5);
  });

  it('have no validation warnings either', () => {
    for (const story of allStories) expect(validateStory(story, storyValidationContext), story.id).toEqual([]);
  });

  it('reach the end, with the moral, along every branch', () => {
    for (const story of allStories) {
      const paths = allPaths(story);
      const branches = story.scenes.filter((scene) => scene.choices).reduce((count, scene) => count * scene.choices!.length, 1);
      expect(paths.length, story.id).toBe(branches);
      const visited = new Set(paths.flatMap((path) => path.scenes));
      expect([...visited].sort(), `${story.id} visits every scene`).toEqual(story.scenes.map((scene) => scene.id).sort());
      for (const path of paths) {
        const last = story.scenes.find((scene) => scene.id === path.scenes[path.scenes.length - 1])!;
        expect(last.moral, `${story.id} ends with a moral`).toBeTruthy();
      }
    }
  });

  it('include every activity type the first release promises', () => {
    const kinds = new Set(allStories.flatMap((story) => story.scenes.flatMap((scene) => (scene.activity ? [scene.activity.kind] : []))));
    expect([...kinds].sort()).toEqual(['arithmetic', 'bar-graph', 'count', 'equal-groups', 'number-line', 'pattern', 'pebble-pot', 'question', 'sequence']);
    const branching = allStories.filter((story) => story.scenes.some((scene) => scene.choices));
    expect(branching.map((story) => story.id)).toEqual(['clever-rabbit', 'monkey-crocodile', 'cooperative-doves']);
  });

  it('say the same numbers in every language as the activity data', () => {
    for (const story of allStories) {
      for (const scene of story.scenes) {
        const activity = scene.activity;
        if (!activity) continue;
        let answer: string | undefined;
        if (activity.kind === 'arithmetic') answer = String(arithmeticAnswer(activity));
        if (activity.kind === 'equal-groups') answer = String(equalGroupsTotal(activity));
        if (activity.kind === 'number-line') answer = String(numberLineTarget(activity));
        if (activity.kind === 'count') answer = String(activity.count);
        if (activity.kind === 'pebble-pot') answer = String(predictionAnswer(activity));
        if (!answer) continue;
        for (const lang of LANGUAGES) expect(activity.explanation[lang], `${story.id}/${activity.id} ${lang}`).toContain(answer);
      }
    }
  });

  it('keep graph answers, patterns, and pebble counts consistent', () => {
    const doves = allStories.find((story) => story.id === 'cooperative-doves')!;
    const graph = doves.scenes.find((scene) => scene.activity?.kind === 'bar-graph')!.activity!;
    if (graph.kind !== 'bar-graph') throw new Error('expected a graph');
    expect(graph.questions.map((question) => graphAnswer(graph, question))).toEqual(['white', 'blue', '3']);
    for (const lang of LANGUAGES) for (const category of graph.categories) expect(graph.explanation[lang]).toContain(String(category.value));

    const net = allStories.find((story) => story.id === 'lion-mouse')!.scenes.find((scene) => scene.activity?.kind === 'pattern')!.activity!;
    if (net.kind !== 'pattern') throw new Error('expected a pattern');
    expect(patternAnswer(net)).toBe('🪢');

    const crow = allStories[0].scenes.find((scene) => scene.activity?.kind === 'pebble-pot')!.activity!;
    if (crow.kind !== 'pebble-pot') throw new Error('expected the pot');
    const count = allStories[0].scenes.find((scene) => scene.activity?.kind === 'count')!.activity!;
    expect(count.kind === 'count' && count.count).toBe(pebblesNeeded(crow));
  });

  it('use more than one age band, and the age filter finds them', () => {
    expect(storiesForAge(allStories, '3-5').map((story) => story.id)).toContain('thirsty-crow');
    expect(storiesForAge(allStories, '7-9').map((story) => story.id)).toEqual(['clever-rabbit', 'lion-mouse', 'monkey-crocodile', 'cooperative-doves']);
    expect(storiesForAge(allStories, 'all')).toHaveLength(5);
  });

  it('record honest translation status', () => {
    for (const story of allStories) expect(story.translation).toEqual({ en: 'source', te: 'draft-needs-native-review', hi: 'draft-needs-native-review' });
  });
});

describe('Story interface text', () => {
  it('has every word in English, Telugu, and Hindi', () => {
    for (const key of uiKeys) for (const lang of LANGUAGES) expect(uiStrings[key][lang].trim(), `${key} ${lang}`).not.toBe('');
  });

  it('uses the right script for each language', () => {
    for (const key of uiKeys) {
      expect(uiStrings[key].te, key).toMatch(/[ఀ-౿]/);
      expect(uiStrings[key].hi, key).toMatch(/[ऀ-ॿ]/);
    }
    for (const story of allStories) {
      for (const scene of story.scenes) {
        for (const line of scene.lines) {
          expect(line.text.te, line.id).toMatch(/[ఀ-౿]/);
          expect(line.text.hi, line.id).toMatch(/[ऀ-ॿ]/);
          expect(line.text.te, `${line.id} has no Devanagari`).not.toMatch(/[ऀ-ॿ]/);
          expect(line.text.hi, `${line.id} has no Telugu`).not.toMatch(/[ఀ-౿]/);
        }
      }
    }
  });
});

import type { Phase, Playback } from './player';
import { currentScene } from './player';
import type { StoryManifest } from './types';

/**
 * How a story moves on by itself.
 * - `story`: plays to the end. Activities are passed over and choices take the main path.
 * - `puzzle`: plays until an activity or a choice, waits for the child, then carries on.
 * In both, lines turn by themselves; the Next button still skips ahead.
 */
export type StoryMode = 'story' | 'puzzle';
export const STORY_MODES: StoryMode[] = ['puzzle', 'story'];

export type AutoStep =
  | { kind: 'wait-line' }
  | { kind: 'skip-activity'; activityId: string }
  | { kind: 'choose'; choiceId: string }
  | { kind: 'continue' }
  | { kind: 'wait-child' }
  | { kind: 'stop' };

/** What the player should do next on its own, given the phase and the mode. */
export function autoStep(story: StoryManifest, playback: Playback, phase: Phase, mode: StoryMode): AutoStep {
  const scene = currentScene(story, playback);
  switch (phase) {
    case 'line':
      return { kind: 'wait-line' };
    case 'activity':
      return mode === 'story' && scene.activity ? { kind: 'skip-activity', activityId: scene.activity.id } : { kind: 'wait-child' };
    case 'choice': {
      const main = scene.choices?.find((choice) => choice.main) ?? scene.choices?.[0];
      return mode === 'story' && main ? { kind: 'choose', choiceId: main.id } : { kind: 'wait-child' };
    }
    case 'continue':
      return { kind: 'continue' };
    default:
      return { kind: 'stop' };
  }
}

/**
 * Time to leave a line on screen when nothing is read aloud (no voice for the
 * language, or the Voice switch off), so a child can read it: longer for longer
 * lines, from 2.5 to 9 seconds. Slower speech settings give more time.
 */
export function readingTimeMs(text: string, speechRate = 1): number {
  const letters = [...text.replace(/\s+/g, ' ').trim()].length;
  const base = 1500 + letters * 70;
  return Math.round(Math.min(9000, Math.max(2500, base)) / Math.min(1.5, Math.max(0.5, speechRate)));
}

/** Pause after a line has been read aloud, before the page turns. */
export const AFTER_SPEECH_MS = 700;

/**
 * If speech never reports that it finished (it can stall on some devices), turn the
 * page anyway after this long, so the story never gets stuck.
 */
export function speechTimeoutMs(text: string): number {
  return readingTimeMs(text) * 2 + 6000;
}

/** Time for "Well done!" and the explanation, before Puzzle mode moves on after a solved activity. */
export function celebrateMs(explanation: string): number {
  return Math.max(3500, readingTimeMs(explanation));
}

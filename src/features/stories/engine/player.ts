import type { Scene, StoryManifest } from './types';

/**
 * Where a child is in a story. Playback only: whether a skill was learned
 * lives in the learning record (progress.ts), not here.
 */
export interface Playback {
  /** One play-through. Completion and learning events are counted once per run. */
  runId: string;
  storyId: string;
  version: number;
  sceneId: string;
  lineIndex: number;
  completedScenes: string[];
  solvedActivities: string[];
  /** Branch taken in each scene with choices. */
  choices: Record<string, string>;
  finished: boolean;
}

export type Phase = 'line' | 'activity' | 'choice' | 'continue' | 'end';

export function sceneById(story: StoryManifest, id: string): Scene | undefined {
  return story.scenes.find((scene) => scene.id === id);
}

/**
 * A new run id: story, time, and a random part, so two devices starting the same
 * story in the same millisecond still get different ids. Older ids without the
 * random part stay valid.
 */
export function newRunId(storyId: string, now = Date.now(), random = Math.random): string {
  return `${storyId}-${now}-${Math.floor(random() * 36 ** 8).toString(36).padStart(8, '0')}`;
}

export function startPlayback(story: StoryManifest, runId = newRunId(story.id)): Playback {
  return {
    runId,
    storyId: story.id,
    version: story.version,
    sceneId: story.startScene,
    lineIndex: 0,
    completedScenes: [],
    solvedActivities: [],
    choices: {},
    finished: false,
  };
}

/**
 * Picks up a saved position when it still fits this version of the story.
 * A position from another version, or one naming a scene that no longer
 * exists, restarts the story instead of showing a broken scene.
 */
export function resumePlayback(story: StoryManifest, saved: Playback | undefined): Playback {
  if (!saved || saved.storyId !== story.id || saved.version !== story.version || !sceneById(story, saved.sceneId)) {
    return startPlayback(story);
  }
  if (saved.finished) return startPlayback(story);
  const scene = sceneById(story, saved.sceneId)!;
  return { ...saved, lineIndex: Math.min(Math.max(0, saved.lineIndex), scene.lines.length) };
}

export function currentScene(story: StoryManifest, playback: Playback): Scene {
  return sceneById(story, playback.sceneId) ?? sceneById(story, story.startScene)!;
}

export function phaseOf(story: StoryManifest, playback: Playback): Phase {
  if (playback.finished) return 'end';
  const scene = currentScene(story, playback);
  if (playback.lineIndex < scene.lines.length) return 'line';
  if (scene.activity && !playback.solvedActivities.includes(scene.activity.id)) return 'activity';
  if (scene.choices?.length) return 'choice';
  return 'continue';
}

export type PlayerAction =
  | { type: 'next-line' }
  | { type: 'replay-scene' }
  | { type: 'solve'; activityId: string }
  | { type: 'choose'; choiceId: string }
  | { type: 'continue' }
  | { type: 'restart' };

function leave(story: StoryManifest, playback: Playback, nextId: string | undefined): Playback {
  const completedScenes = playback.completedScenes.includes(playback.sceneId)
    ? playback.completedScenes
    : [...playback.completedScenes, playback.sceneId];
  if (!nextId) return { ...playback, completedScenes, finished: true };
  if (!sceneById(story, nextId)) return playback;
  return { ...playback, completedScenes, sceneId: nextId, lineIndex: 0 };
}

/** Every change of position goes through here. Actions that do not fit the current phase are ignored. */
export function playerReducer(story: StoryManifest, playback: Playback, action: PlayerAction): Playback {
  const phase = phaseOf(story, playback);
  const scene = currentScene(story, playback);
  switch (action.type) {
    case 'next-line':
      return phase === 'line' ? { ...playback, lineIndex: playback.lineIndex + 1 } : playback;
    case 'replay-scene':
      return phase === 'end' ? playback : { ...playback, lineIndex: 0 };
    case 'solve':
      if (phase !== 'activity' || scene.activity?.id !== action.activityId) return playback;
      return { ...playback, solvedActivities: [...playback.solvedActivities, action.activityId] };
    case 'choose': {
      if (phase !== 'choice') return playback;
      const choice = scene.choices?.find((item) => item.id === action.choiceId);
      if (!choice) return playback;
      return leave(story, { ...playback, choices: { ...playback.choices, [scene.id]: choice.id } }, choice.next);
    }
    case 'continue':
      return phase === 'continue' ? leave(story, playback, scene.next) : playback;
    case 'restart':
      return startPlayback(story, newRunId(story.id));
    default:
      return playback;
  }
}

/** Rough position through the story, for progress bars. Branch scenes count once visited. */
export function storyFraction(story: StoryManifest, playback: Playback): number {
  if (playback.finished) return 1;
  return Math.min(0.99, playback.completedScenes.length / Math.max(1, story.scenes.length));
}

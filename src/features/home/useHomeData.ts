import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { speak } from '../../services/speech';
import { loadDailyChallenge, loadStoryProgress } from '../../services/storage';
import { achievementsList } from '../../data/achievements';
import { DAILY_QUESTION_COUNT, normalizeDailyRecord } from '../daily-challenge/dailySelection';
import { overallLearningProgress } from '../../services/progressStats';
import { gameCatalog, type GameEntry } from '../learning-games/catalog';
import type { LearningProgress } from '../../types';

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** The story to carry on with: the last one left part-way, or the first one not yet started. */
export interface StoryPick {
  id: string;
  title: string;
  emoji: string;
  /** 0 to 1: scenes finished out of all scenes. */
  progress: number;
  started: boolean;
}

/** Picks a story for "Keep reading". Loads the story text on demand, so Home stays small. */
export function useStoryPick(): StoryPick | null {
  const [pick, setPick] = useState<StoryPick | null>(null);
  useEffect(() => {
    let live = true;
    void Promise.all([import('../stories/content/library'), import('../stories/engine/progress')]).then(([library, progress]) => {
      if (!live) return;
      const data = loadStoryProgress();
      const stories = library.publishedStories();
      const resumable = stories
        .filter((story) => progress.canResume(data, story))
        .sort((a, b) => (data.stories[b.id]?.updatedAt ?? 0) - (data.stories[a.id]?.updatedAt ?? 0));
      const story = resumable[0] ?? stories.find((item) => !progress.isStarted(data, item.id)) ?? stories[0];
      if (!story) return;
      const done = data.stories[story.id]?.playback?.completedScenes.length ?? 0;
      setPick({
        id: story.id,
        title: story.title.en,
        emoji: story.emoji,
        progress: resumable[0] === story ? Math.min(1, done / Math.max(1, story.scenes.length)) : 0,
        started: resumable[0] === story,
      });
    });
    return () => {
      live = false;
    };
  }, []);
  return pick;
}

/** True once a child has played a game at least once. */
export function hasPlayed(progress: LearningProgress, id: string): boolean {
  return (progress.gameRounds[id] ?? 0) > 0 || (progress.gameLevels[id]?.length ?? 0) > 0 || progress.gameSkill?.[id] !== undefined;
}

/** Avi's pick: the first game in the list not played yet, or else the least played. */
export function nextGame(progress: LearningProgress, games: GameEntry[] = gameCatalog): GameEntry {
  const fresh = games.find((game) => !hasPlayed(progress, game.id));
  if (fresh) return fresh;
  return [...games].sort((a, b) => (progress.gameRounds[a.id] ?? 0) - (progress.gameRounds[b.id] ?? 0))[0];
}

/** What every look's Home shows: progress, today's questions, and where to go. */
export function useHomeData() {
  const navigate = useNavigate();
  const progress = useAppStore((s) => s.progress);
  const settings = useAppStore((s) => s.settings);
  const summary = overallLearningProgress(progress);
  const daily = normalizeDailyRecord(loadDailyChallenge());
  const badges = progress.achievementsEarned.length;
  const played = gameCatalog.filter((game) => hasPlayed(progress, game.id)).length;

  const dailyText = daily.completed
    ? `All done today! ${daily.stars} ${daily.stars === 1 ? 'star' : 'stars'}.`
    : daily.answered > 0
      ? `${daily.answered} done, ${DAILY_QUESTION_COUNT - daily.answered} to go`
      : 'Five fresh questions are waiting';

  const say = (text: string) => {
    if (settings.speechEnabled) speak(text, { rate: settings.speechRate });
  };

  const go = (path: string, spoken?: string) => {
    navigate(path);
    if (spoken) say(spoken);
  };

  return {
    progress,
    summary,
    daily,
    dailyText,
    dailyTotal: DAILY_QUESTION_COUNT,
    badges,
    badgeTotal: achievementsList.length,
    played,
    gameTotal: gameCatalog.length,
    say,
    go,
  };
}

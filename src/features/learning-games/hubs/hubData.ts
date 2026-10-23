import type { LearningProgress } from '../../../types';
import type { WorldKey } from '../../../theme/tokens';
import type { QuizGameType } from '../questions';
import { gameCatalog, type GameId } from '../catalog';

/** A quiz game as the Games list shows it. */
export interface QuizCard {
  type: QuizGameType;
  title: string;
  description: string;
  emoji: string;
  world: WorldKey;
}

export type Topic = 'letters' | 'numbers' | 'think' | 'explore';

export const topics: { id: Topic | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '⭐' },
  { id: 'letters', label: 'Letters', emoji: '🔤' },
  { id: 'numbers', label: 'Numbers', emoji: '🔢' },
  { id: 'think', label: 'Think', emoji: '🧠' },
  { id: 'explore', label: 'Explore', emoji: '🔭' },
];

/** Each game's topics, for the filters. A game can sit under more than one. */
const gameTopics: Record<GameId | QuizGameType, Topic[]> = {
  tracing: ['letters'],
  'alphabet-catcher': ['letters'],
  spell: ['letters'],
  balloons: ['letters', 'numbers'],
  robot: ['think'],
  puzzle: ['think'],
  'photo-puzzle': ['think'],
  shadow: ['think', 'explore'],
  memory: ['think'],
  rhythm: ['explore'],
  'sound-safari': ['explore'],
  chef: ['numbers', 'explore'],
  emotions: ['explore'],
  space: ['explore'],
  racer: ['numbers'],
  dino: ['letters', 'explore'],
  'find-letter': ['letters'],
  'guess-animal': ['explore'],
  count: ['numbers'],
  match: ['letters'],
  listen: ['letters'],
  'odd-one-out': ['think'],
  pattern: ['think'],
};

/** One word per game, for Bright Blocks, where many children cannot read yet. */
const shortNames: Record<GameId | QuizGameType, string> = {
  tracing: 'Trace',
  'alphabet-catcher': 'Catch',
  spell: 'Spell',
  balloons: 'Balloons',
  robot: 'Robot',
  puzzle: 'Puzzle',
  'photo-puzzle': 'Photos',
  shadow: 'Shadows',
  memory: 'Memory',
  rhythm: 'Rhythm',
  'sound-safari': 'Sounds',
  chef: 'Chef',
  emotions: 'Feelings',
  space: 'Space',
  racer: 'Racer',
  dino: 'Dino',
  'find-letter': 'Letters',
  'guess-animal': 'Animals',
  count: 'Count',
  match: 'Match',
  listen: 'Listen',
  'odd-one-out': 'Odd one',
  pattern: 'Next?',
};

export interface HubItem {
  /** Progress key: a catalog id, or `quiz-<type>`. */
  key: string;
  title: string;
  short: string;
  description: string;
  emoji: string;
  world: WorldKey;
  topics: Topic[];
  played: boolean;
  /** "Level 4", "3 done", or "New". */
  status: string;
  /** A catalog path, or null for a quiz, which opens inside the Games page. */
  path: string | null;
  quiz?: QuizGameType;
}

function statusOf(progress: LearningProgress, key: string): { played: boolean; status: string } {
  const level = progress.gameSkill?.[key];
  const done = progress.gameLevels[key]?.length ?? 0;
  const rounds = progress.gameRounds[key] ?? 0;
  if (level !== undefined) return { played: true, status: `Level ${level}` };
  if (done > 0) return { played: true, status: `${done} done` };
  if (rounds > 0) return { played: true, status: `Played ${rounds}×` };
  return { played: false, status: 'New' };
}

/** Every game and quiz, in the catalog order, with what this child has done in each. */
export function hubItems(progress: LearningProgress, quizzes: QuizCard[]): HubItem[] {
  const games: HubItem[] = gameCatalog.map((game) => ({
    key: game.id,
    title: game.title,
    short: shortNames[game.id],
    description: game.description,
    emoji: game.emoji,
    world: game.world,
    topics: gameTopics[game.id],
    path: game.path,
    ...statusOf(progress, game.id),
  }));
  const quizItems: HubItem[] = quizzes.map((quiz) => ({
    key: `quiz-${quiz.type}`,
    title: quiz.title,
    short: shortNames[quiz.type],
    description: quiz.description,
    emoji: quiz.emoji,
    world: quiz.world,
    topics: gameTopics[quiz.type],
    path: null,
    quiz: quiz.type,
    ...statusOf(progress, `quiz-${quiz.type}`),
  }));
  return [...games, ...quizItems];
}

export function filterItems(items: HubItem[], topic: Topic | 'all'): HubItem[] {
  return topic === 'all' ? items : items.filter((item) => item.topics.includes(topic));
}

/** Avi's pick: the first game not played yet, or the first one if all have been played. */
export function aviPick(items: HubItem[]): HubItem {
  return items.find((item) => !item.played && item.path) ?? items.find((item) => !item.played) ?? items[0];
}

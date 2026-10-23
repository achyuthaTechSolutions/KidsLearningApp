import type { Achievement } from '../types';
import { NUMBER_TOTAL } from '../services/progressStats';
import { ADVENTURE_GAME_IDS } from '../features/learning-games/catalog';
import { recipes } from '../features/little-chef/recipes';
import { destinations } from '../features/space-explorer/destinations';
import { robotLevels } from '../features/robot-adventure/engine';

const levelsDone = (p: { gameLevels?: Record<string, string[]> }, gameId: string, valid: string[]) =>
  (p.gameLevels?.[gameId] ?? []).filter((id) => valid.includes(id)).length;

export const PERFECT_SCORE_STREAK = 10;

export const achievementsList: Achievement[] = [
  {
    id: 'first-letter',
    title: 'First Letter',
    description: 'Explored your first letter!',
    emoji: '🎉',
    condition: (p) => p.lettersExplored.length >= 1,
  },
  {
    id: 'alphabet-explorer',
    title: 'Alphabet Explorer',
    description: 'Explored all 26 letters!',
    emoji: '🏆',
    condition: (p) => p.lettersExplored.length >= 26,
  },
  {
    id: 'half-alphabet',
    title: 'Halfway There',
    description: 'Explored 13 letters!',
    emoji: '⭐',
    condition: (p) => p.lettersExplored.length >= 13,
  },
  {
    id: 'first-number',
    title: 'Number Star',
    description: 'Explored your first number!',
    emoji: '🔢',
    condition: (p) => p.numbersExplored.length >= 1,
  },
  {
    id: 'all-numbers',
    title: 'Counting Master',
    description: 'Explored all numbers from 0 to 20!',
    emoji: '🧮',
    condition: (p) => p.numbersExplored.length >= NUMBER_TOTAL,
  },
  {
    id: 'first-animal',
    title: 'Animal Friend',
    description: 'Discovered your first animal!',
    emoji: '🐾',
    condition: (p) => p.animalsDiscovered.length >= 1,
  },
  {
    id: 'animal-lover',
    title: 'Animal Lover',
    description: 'Discovered 10 animals!',
    emoji: '🦁',
    condition: (p) => p.animalsDiscovered.length >= 10,
  },
  {
    id: 'first-word',
    title: 'Word Learner',
    description: 'Learned your first word!',
    emoji: '📖',
    condition: (p) => p.wordsLearned.length >= 1,
  },
  {
    id: 'word-collector',
    title: 'Word Collector',
    description: 'Learned 20 words!',
    emoji: '📚',
    condition: (p) => p.wordsLearned.length >= 20,
  },
  {
    id: 'first-game',
    title: 'Game Player',
    description: 'Completed your first game!',
    emoji: '🎮',
    condition: (p) => p.gamesCompleted >= 1,
  },
  {
    id: 'quiz-champion',
    title: 'Quiz Champion',
    description: 'Completed 5 games!',
    emoji: '🏅',
    condition: (p) => p.gamesCompleted >= 5,
  },
  {
    id: 'little-musician',
    title: 'Little Musician',
    description: 'Played a musical instrument!',
    emoji: '🎵',
    condition: (p) => p.musicActivities >= 1,
  },
  {
    id: 'music-star',
    title: 'Music Star',
    description: 'Completed 10 music activities!',
    emoji: '🎸',
    condition: (p) => p.musicActivities >= 10,
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Got 10 correct answers in a row!',
    emoji: '💯',
    condition: (p) => p.currentStreak >= PERFECT_SCORE_STREAK,
  },
  {
    id: 'super-learner',
    title: 'Super Learner',
    description: 'Explored letters, numbers, and animals!',
    emoji: '🌟',
    condition: (p) =>
      p.lettersExplored.length >= 5 &&
      p.numbersExplored.length >= 5 &&
      p.animalsDiscovered.length >= 3,
  },
  {
    id: 'letter-tracer',
    title: 'Letter Tracer',
    description: 'Traced 10 different letters!',
    emoji: '✍️',
    condition: (p) => (p.gameLevels?.tracing ?? []).length >= 10,
  },
  {
    id: 'robot-coder',
    title: 'Robot Coder',
    description: 'Guided the robot through 3 levels!',
    emoji: '🤖',
    condition: (p) => levelsDone(p, 'robot', robotLevels.map((level) => level.id)) >= 3,
  },
  {
    id: 'master-chef',
    title: 'Little Chef',
    description: 'Made every recipe in the pretend kitchen!',
    emoji: '🧑‍🍳',
    condition: (p) => levelsDone(p, 'chef', recipes.map((recipe) => recipe.id)) >= recipes.length,
  },
  {
    id: 'space-explorer',
    title: 'Space Explorer',
    description: 'Visited every place on the space map!',
    emoji: '🚀',
    condition: (p) => levelsDone(p, 'space', destinations.map((destination) => destination.id)) >= destinations.length,
  },
  {
    id: 'game-adventurer',
    title: 'Game Adventurer',
    description: 'Finished a round in 5 different new games!',
    emoji: '🗺️',
    condition: (p) => ADVENTURE_GAME_IDS.filter((id) => (p.gameRounds?.[id] ?? 0) > 0).length >= 5,
  },
];

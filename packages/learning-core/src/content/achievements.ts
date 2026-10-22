import type { Achievement } from '../types';
import { NUMBER_TOTAL } from '../progress/stats';

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
];

export interface LetterContent {
  letter: string;
  uppercase: string;
  lowercase: string;
  word: string;
  description: string;
  phonetic: string;
  emoji: string;
}

export interface NumberContent {
  value: number;
  word: string;
  description: string;
  objects: string;
  emoji: string;
}

export interface AnimalContent {
  name: string;
  description: string;
  sound: string;
  emoji: string;
  habitat: string;
  funFact: string;
}

export interface VocabularyItem {
  word: string;
  category: VocabularyCategory;
  description: string;
  emoji: string;
}

export type VocabularyCategory =
  | 'fruits'
  | 'vegetables'
  | 'food'
  | 'vehicles'
  | 'colors'
  | 'shapes'
  | 'body'
  | 'household'
  | 'nature';

export interface SpecialKeyContent {
  key: string;
  name: string;
  description: string;
  emoji: string;
}

export interface InstrumentNote {
  note: string;
  frequency: number;
  key: string;
  label: string;
  isBlack?: boolean;
}

export interface GameQuestion {
  id: string;
  type: 'letter' | 'animal' | 'counting' | 'matching' | 'listening';
  prompt: string;
  correctAnswer: string;
  options: string[];
  image?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  condition: (progress: LearningProgress) => boolean;
}

export interface LearningProgress {
  lettersExplored: string[];
  numbersExplored: number[];
  animalsDiscovered: string[];
  wordsLearned: string[];
  gamesCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
  currentStreak: number;
  musicActivities: number;
  achievementsEarned: string[];
  lastActivity: string | null;
}

export interface AppSettings {
  speechEnabled: boolean;
  soundEnabled: boolean;
  volume: number;
  speechRate: number;
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  selectedVoice: string | null;
}

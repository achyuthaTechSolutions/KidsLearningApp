import type { WorldKey } from '../../theme/tokens';

/** Stable ids, also used as progress keys. Never rename one that has shipped. */
export type GameId =
  | 'balloons'
  | 'memory'
  | 'spell'
  | 'dino'
  | 'alphabet-catcher'
  | 'robot'
  | 'rhythm'
  | 'puzzle'
  | 'sound-safari'
  | 'shadow'
  | 'chef'
  | 'space'
  | 'emotions'
  | 'tracing';

export type GameCategory = 'letters' | 'logic' | 'music' | 'pretend' | 'discovery' | 'action';

export interface GameEntry {
  id: GameId;
  path: string;
  title: string;
  description: string;
  emoji: string;
  world: WorldKey;
  category: GameCategory;
}

export const gameCategories: { id: GameCategory; title: string }[] = [
  { id: 'letters', title: 'Letters and Words' },
  { id: 'logic', title: 'Logic and Puzzles' },
  { id: 'music', title: 'Music and Sounds' },
  { id: 'pretend', title: 'Pretend Play and Feelings' },
  { id: 'discovery', title: 'Science and Discovery' },
  { id: 'action', title: 'Move and Play' },
];

export const gameCatalog: GameEntry[] = [
  { id: 'tracing', path: '/games/tracing', title: 'Letter Tracing', description: 'Trace big and small letters with your finger!', emoji: '✏️', world: 'green', category: 'letters' },
  { id: 'alphabet-catcher', path: '/games/alphabet-catcher', title: 'Alphabet Catcher', description: 'Catch the letter you hear!', emoji: '🔤', world: 'violet', category: 'letters' },
  { id: 'spell', path: '/spell', title: 'Word Builder', description: 'Tap the letters to spell the word!', emoji: '🧩', world: 'pink', category: 'letters' },
  { id: 'balloons', path: '/balloons', title: 'Balloon Pop', description: 'Pop the letters, numbers, and colours you hear!', emoji: '🎈', world: 'blue', category: 'letters' },
  { id: 'robot', path: '/games/robot', title: 'Little Robot', description: 'Plan the moves and guide the robot home!', emoji: '🤖', world: 'teal', category: 'logic' },
  { id: 'puzzle', path: '/games/puzzle', title: 'Puzzle Planet', description: 'Put the picture pieces back together!', emoji: '🪐', world: 'orange', category: 'logic' },
  { id: 'shadow', path: '/games/shadow', title: 'Shadow Detective', description: 'Whose shadow is this?', emoji: '🔦', world: 'slate', category: 'logic' },
  { id: 'memory', path: '/memory', title: 'Memory Match', description: 'Flip the cards and find the pairs!', emoji: '🃏', world: 'violet', category: 'logic' },
  { id: 'rhythm', path: '/games/rhythm', title: 'Rhythm Hero', description: 'Listen to the beat, then tap it back!', emoji: '🥁', world: 'red', category: 'music' },
  { id: 'sound-safari', path: '/games/sound-safari', title: 'Sound Safari', description: 'Listen closely. What makes that sound?', emoji: '🎧', world: 'sun', category: 'music' },
  { id: 'chef', path: '/games/chef', title: 'Little Chef', description: 'Follow the recipe and count the food!', emoji: '🥗', world: 'green', category: 'pretend' },
  { id: 'emotions', path: '/games/emotions', title: 'Emotion Explorer', description: 'How might our friends feel?', emoji: '😊', world: 'pink', category: 'pretend' },
  { id: 'space', path: '/games/space', title: 'Space Explorer', description: 'Fly to the Moon, Mars, and beyond!', emoji: '🚀', world: 'blue', category: 'discovery' },
  { id: 'dino', path: '/dino', title: 'Dino Dash', description: 'Run, jump, and catch letters. Endless levels!', emoji: '🦖', world: 'green', category: 'action' },
];

export function gameById(id: GameId): GameEntry {
  const entry = gameCatalog.find((game) => game.id === id);
  if (!entry) throw new Error(`Unknown game ${id}`);
  return entry;
}

/** The ten games added together with this catalogue, used by the Game Adventurer badge. */
export const ADVENTURE_GAME_IDS: GameId[] = [
  'alphabet-catcher', 'robot', 'rhythm', 'puzzle', 'sound-safari', 'shadow', 'chef', 'space', 'emotions', 'tracing',
];

/** A shared empty list, so store selectors never return a new array on each render. */
export const NO_LEVELS: readonly string[] = Object.freeze([]);

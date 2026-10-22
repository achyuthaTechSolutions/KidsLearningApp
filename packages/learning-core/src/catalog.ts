import type { WorldKey } from './theme/tokens';

export type SectionGroup = 'home' | 'learn' | 'play' | 'grownups';

export interface SectionInfo {
  path: string;
  label: string;
  shortLabel: string;
  tagline: string;
  world: WorldKey;
  emoji: string;
  group: SectionGroup;
}

export const sectionCatalog: SectionInfo[] = [
  { path: '/', label: 'Home', shortLabel: 'Home', tagline: 'Pick something fun', world: 'violet', emoji: '🏡', group: 'home' },
  { path: '/daily', label: 'Daily Challenge', shortLabel: 'Daily', tagline: 'Five questions for today', world: 'red', emoji: '🌟', group: 'play' },
  { path: '/dino', label: 'Dino Dash', shortLabel: 'Dino', tagline: 'Run, jump, and catch letters', world: 'green', emoji: '🦖', group: 'play' },
  { path: '/keyboard', label: 'Keyboard Explorer', shortLabel: 'Keys', tagline: 'Tap a key, hear a word', world: 'violet', emoji: '⌨️', group: 'learn' },
  { path: '/alphabet', label: 'Alphabet World', shortLabel: 'ABC', tagline: 'Meet all 26 letters', world: 'green', emoji: '🔤', group: 'learn' },
  { path: '/numbers', label: 'Number World', shortLabel: '123', tagline: 'Count from 0 to 20', world: 'sun', emoji: '🔢', group: 'learn' },
  { path: '/animals', label: 'Animal Kingdom', shortLabel: 'Animals', tagline: 'Hear what animals say', world: 'orange', emoji: '🦁', group: 'learn' },
  { path: '/words', label: 'My First Words', shortLabel: 'Words', tagline: 'Fruits, cars, colours and more', world: 'pink', emoji: '📚', group: 'learn' },
  { path: '/music', label: 'Music Studio', shortLabel: 'Music', tagline: 'Piano, drums, and more', world: 'blue', emoji: '🎹', group: 'play' },
  { path: '/games', label: 'Learning Games', shortLabel: 'Games', tagline: 'Five games to play', world: 'teal', emoji: '🎮', group: 'play' },
  { path: '/achievements', label: 'My Achievements', shortLabel: 'Badges', tagline: 'Stars and badges you earned', world: 'gold', emoji: '🏆', group: 'play' },
  { path: '/settings', label: 'Parent Settings', shortLabel: 'Parents', tagline: 'Sound, speech, and progress', world: 'slate', emoji: '⚙️', group: 'grownups' },
  { path: '/privacy', label: 'Privacy', shortLabel: 'Privacy', tagline: 'What stays on this device', world: 'slate', emoji: '🛡️', group: 'grownups' },
];

export function sectionForPath(path: string): SectionInfo {
  return sectionCatalog.find((section) => section.path === path) ?? sectionCatalog[0];
}

/** Maps the store's `lastActivity` value to the screen that recorded it. */
export const activityPaths: Record<string, string> = {
  keyboard: '/alphabet',
  numbers: '/numbers',
  animals: '/animals',
  vocabulary: '/words',
  games: '/games',
  music: '/music',
};

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

import type { SvgIconComponent } from '@mui/icons-material';
import {
  HomeRounded,
  StarRounded,
  KeyboardRounded,
  AbcRounded,
  NumbersRounded,
  PetsRounded,
  MenuBookRounded,
  MusicNoteRounded,
  SportsEsportsRounded,
  DirectionsRunRounded,
  EmojiEventsRounded,
  AutoStoriesRounded,
  CelebrationRounded,
  StyleRounded,
  ExtensionRounded,
  SettingsRounded,
  PolicyRounded,
} from '@mui/icons-material';
import type { WorldKey } from '../theme/tokens';

export type SectionGroup = 'home' | 'learn' | 'play' | 'grownups';

export interface Section {
  path: string;
  label: string;
  shortLabel: string;
  tagline: string;
  world: WorldKey;
  Icon: SvgIconComponent;
  emoji: string;
  group: SectionGroup;
}

export const sections: Section[] = [
  { path: '/', label: 'Home', shortLabel: 'Home', tagline: 'Pick something fun', world: 'violet', Icon: HomeRounded, emoji: '🏡', group: 'home' },
  { path: '/daily', label: 'Daily Challenge', shortLabel: 'Daily', tagline: 'Five questions for today', world: 'red', Icon: StarRounded, emoji: '🌟', group: 'play' },
  { path: '/dino', label: 'Dino Dash', shortLabel: 'Dino', tagline: 'Run, jump, and catch letters', world: 'green', Icon: DirectionsRunRounded, emoji: '🦖', group: 'play' },
  { path: '/balloons', label: 'Balloon Pop', shortLabel: 'Balloons', tagline: 'Pop the right balloons', world: 'blue', Icon: CelebrationRounded, emoji: '🎈', group: 'play' },
  { path: '/memory', label: 'Memory Match', shortLabel: 'Memory', tagline: 'Flip cards, find pairs', world: 'violet', Icon: StyleRounded, emoji: '🃏', group: 'play' },
  { path: '/spell', label: 'Word Builder', shortLabel: 'Spell', tagline: 'Tap letters to spell words', world: 'pink', Icon: ExtensionRounded, emoji: '🧩', group: 'play' },
  { path: '/stories', label: 'Story Time', shortLabel: 'Stories', tagline: 'Animal stories with maths and morals', world: 'orange', Icon: AutoStoriesRounded, emoji: '📖', group: 'learn' },
  { path: '/keyboard', label: 'Keyboard Explorer', shortLabel: 'Keys', tagline: 'Tap a key, hear a word', world: 'violet', Icon: KeyboardRounded, emoji: '⌨️', group: 'learn' },
  { path: '/alphabet', label: 'Alphabet World', shortLabel: 'ABC', tagline: 'Meet all 26 letters', world: 'green', Icon: AbcRounded, emoji: '🔤', group: 'learn' },
  { path: '/numbers', label: 'Number World', shortLabel: '123', tagline: 'Count from 0 to 20', world: 'sun', Icon: NumbersRounded, emoji: '🔢', group: 'learn' },
  { path: '/animals', label: 'Animal Kingdom', shortLabel: 'Animals', tagline: 'Hear what animals say', world: 'orange', Icon: PetsRounded, emoji: '🦁', group: 'learn' },
  { path: '/words', label: 'My First Words', shortLabel: 'Words', tagline: 'Fruits, cars, colours and more', world: 'pink', Icon: MenuBookRounded, emoji: '📚', group: 'learn' },
  { path: '/music', label: 'Music Studio', shortLabel: 'Music', tagline: 'Piano, drums, and more', world: 'blue', Icon: MusicNoteRounded, emoji: '🎹', group: 'play' },
  { path: '/games', label: 'Learning Games', shortLabel: 'Games', tagline: 'Trace, build, listen, and explore', world: 'teal', Icon: SportsEsportsRounded, emoji: '🎮', group: 'play' },
  { path: '/achievements', label: 'My Achievements', shortLabel: 'Badges', tagline: 'Stars and badges you earned', world: 'gold', Icon: EmojiEventsRounded, emoji: '🏆', group: 'play' },
  { path: '/settings', label: 'Parent Settings', shortLabel: 'Parents', tagline: 'Sound, speech, and progress', world: 'slate', Icon: SettingsRounded, emoji: '⚙️', group: 'grownups' },
  { path: '/privacy', label: 'Privacy', shortLabel: 'Privacy', tagline: 'What stays on this device', world: 'slate', Icon: PolicyRounded, emoji: '🛡️', group: 'grownups' },
];

export function sectionFor(path: string): Section {
  const exact = sections.find((section) => section.path === path);
  if (exact) return exact;
  // Games without their own menu entry, such as /games/robot, belong to Learning Games.
  if (path.startsWith('/games/')) return sections.find((section) => section.path === '/games') ?? sections[0];
  if (path.startsWith('/stories/')) return sections.find((section) => section.path === '/stories') ?? sections[0];
  return sections[0];
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

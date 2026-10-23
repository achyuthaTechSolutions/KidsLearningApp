import type { AppLook } from '../types';
import { colors, worlds } from './tokens';

/**
 * The app's looks. Classic is the original design. The other three come from the
 * redesign canvas, so a family can try each one in the real app before choosing:
 *
 * - Storybook Garden: warm cream paper, deep indigo text, marigold and leaf green.
 * - Bright Blocks: flat bright blocks with thick dark outlines, for pre-readers.
 * - Adventure Map: sea and sand, islands joined by a path.
 *
 * A look changes the app's frame: background, surfaces, text, fonts, shapes,
 * buttons, the menus, Avi, Home, and the Games list. Inside a game, the game keeps
 * its own colours, which are already contrast-checked.
 */

export type Surface = 'lip' | 'block' | 'soft';

export interface LookSpec {
  id: AppLook;
  name: string;
  description: string;
  /** Who Avi is in this look, for screen readers. */
  aviKind: string;
  background: string;
  paper: string;
  outline: string;
  outlineStrong: string;
  text: string;
  textSecondary: string;
  primary: { main: string; dark: string; light: string; contrastText: string };
  /** Display and body fonts. Each is followed by the Indic fallbacks in `tokens.fonts`. */
  display: string;
  body: string;
  /** Corner radius for cards and buttons, in px. */
  radius: number;
  /** Classic chunky lip, thick ink outline with a hard offset shadow, or flat and soft. */
  surface: Surface;
  /** Strong line colour for 'block' outlines and the bottom menu. */
  ink: string;
}

/** Colours used by the Home and Games screens of each look, taken from the canvas. */
export const garden = {
  cream: '#FFF8EC',
  sand: '#F6E7C8',
  border: '#E8DCC4',
  honey: '#FBE9C4',
  honeyText: '#6A4A1C',
  indigo: '#2A2550',
  indigoSoft: '#4A4478',
  muted: '#5E5A7A',
  marigold: '#F2A93B',
  banner: '#F7C873',
  leaf: '#3F8F5B',
  leafDark: '#2F7446',
  leafSoft: '#E6F4EA',
  terracotta: '#B5502C',
  dot: '#EBC98C',
} as const;

export const blocks = {
  ink: '#1B1F3B',
  paper: '#F4F6FF',
  blue: '#2F5BEA',
  yellow: '#FFC93C',
  coral: '#FF6B4A',
  green: '#22C47E',
  purple: '#B79CFF',
  sky: '#8FD3FF',
  butter: '#FFE29A',
  mint: '#C9F2DC',
  peach: '#FFD3C7',
  lilac: '#E4DAFF',
  cheek: '#FF8C6B',
} as const;

export const map = {
  deep: '#0D4250',
  sea: '#BFE7EC',
  wave: '#A6DCE3',
  sand: '#F5DFA8',
  cream: '#FFFBF0',
  orange: '#F27B35',
  rust: '#8A3A0C',
  green: '#4E9F3D',
  greenDark: '#3E8530',
  gold: '#F5B83D',
  mist: '#CFE3E8',
  elephant: '#9FB4C7',
  elephantLight: '#B3C6D6',
} as const;

export const looks: Record<AppLook, LookSpec> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'The original colourful look with Avi the owl.',
    aviKind: 'owl',
    background: colors.background,
    paper: colors.surface,
    outline: colors.outline,
    outlineStrong: colors.outlineStrong,
    text: colors.text,
    textSecondary: colors.textSecondary,
    primary: { main: worlds.violet.main, dark: worlds.violet.dark, light: worlds.violet.light, contrastText: '#FFFFFF' },
    display: '"Fredoka"',
    body: '"Nunito"',
    radius: 16,
    surface: 'lip',
    ink: colors.text,
  },
  garden: {
    id: 'garden',
    name: 'Storybook Garden',
    description: 'Warm and calm, like a picture book. Avi is a leaf-green owl.',
    aviKind: 'owl',
    background: garden.cream,
    paper: '#FFFFFF',
    outline: garden.border,
    outlineStrong: '#D9C9A8',
    text: garden.indigo,
    textSecondary: garden.muted,
    primary: { main: garden.indigo, dark: '#1A1638', light: '#5B6FD6', contrastText: garden.cream },
    display: '"Baloo 2"',
    body: '"Nunito"',
    radius: 22,
    surface: 'soft',
    ink: garden.indigo,
  },
  blocks: {
    id: 'blocks',
    name: 'Bright Blocks',
    description: 'Big bold blocks to find by colour and picture. Avi is a round sunny friend.',
    aviKind: 'round sunny friend',
    background: blocks.paper,
    paper: '#FFFFFF',
    outline: blocks.ink,
    outlineStrong: blocks.ink,
    text: blocks.ink,
    textSecondary: '#3D4266',
    primary: { main: blocks.blue, dark: '#1E3FB8', light: blocks.sky, contrastText: '#FFFFFF' },
    display: '"Fredoka"',
    body: '"Nunito"',
    radius: 24,
    surface: 'block',
    ink: blocks.ink,
  },
  map: {
    id: 'map',
    name: 'Adventure Map',
    description: 'Explore islands on a map, one stop at a time. Avi is a little elephant explorer.',
    aviKind: 'little elephant',
    background: map.sea,
    paper: map.cream,
    outline: map.mist,
    outlineStrong: map.deep,
    text: map.deep,
    textSecondary: '#2F5F6B',
    primary: { main: map.deep, dark: '#072A33', light: '#3C7A89', contrastText: map.cream },
    display: '"Sniglet"',
    body: '"Lexend"',
    radius: 22,
    surface: 'soft',
    ink: map.deep,
  },
};

/** Height of each look's phone bottom menu, so pages leave room for it. */
export const lookBarHeight: Record<Exclude<AppLook, 'classic'>, number> = { garden: 76, blocks: 92, map: 80 };

export const lookOrder: AppLook[] = ['classic', 'garden', 'blocks', 'map'];

const loaded = new Set<AppLook>(['classic', 'blocks']);

/**
 * Loads a look's fonts the first time it is chosen, so families who never pick it
 * never download them. Classic and Bright Blocks use the fonts bundled already.
 */
export function loadLookFonts(look: AppLook): void {
  if (loaded.has(look)) return;
  loaded.add(look);
  if (look === 'garden') {
    void import('@fontsource/baloo-2/latin-600.css');
    void import('@fontsource/baloo-2/latin-700.css');
    void import('@fontsource/baloo-2/latin-800.css');
  } else if (look === 'map') {
    void import('@fontsource/sniglet/latin-400.css');
    void import('@fontsource/sniglet/latin-800.css');
    void import('@fontsource/lexend/latin-400.css');
    void import('@fontsource/lexend/latin-500.css');
    void import('@fontsource/lexend/latin-600.css');
    void import('@fontsource/lexend/latin-700.css');
  }
}

/** Sets the font variables `tokens.fonts` reads, so every screen uses the look's fonts. */
export function applyLookFonts(look: AppLook, root: HTMLElement = document.documentElement): void {
  loadLookFonts(look);
  root.style.setProperty('--kl-font-display', looks[look].display);
  root.style.setProperty('--kl-font-body', looks[look].body);
  root.dataset.look = look;
}

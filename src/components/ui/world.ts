import { alpha, useTheme, type Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { colors, lip, motion, worlds, type WorldColors, type WorldKey } from '../../theme/tokens';

export interface ResolvedWorld extends WorldColors {
  key: WorldKey;
  /** Tile background that suits the current light or dark mode. */
  tint: string;
  /** Small text color that suits the current mode. */
  text: string;
}

export function resolveWorld(key: WorldKey, mode: 'light' | 'dark'): ResolvedWorld {
  const w = worlds[key];
  const dark = mode === 'dark';
  return { ...w, key, tint: dark ? alpha(w.main, 0.2) : w.soft, text: dark ? w.inkDark : w.ink };
}

export function useWorld(key: WorldKey): ResolvedWorld {
  const theme = useTheme();
  return resolveWorld(key, theme.palette.mode);
}

export function outlineColor(theme: Theme): string {
  return theme.palette.mode === 'dark' ? colors.darkOutline : colors.outlineStrong;
}

type TactileState = 'idle' | 'selected' | 'done';

interface TactileOptions {
  state?: TactileState;
  depth?: number;
  radius?: number;
}

/**
 * Chunky, pressable surface with a colored lip underneath, in the spirit of
 * Duolingo-style buttons. Selected tiles fill with the world color; explored
 * tiles keep a soft tint so a child can see what they have visited.
 */
export function tactile(theme: Theme, world: ResolvedWorld, options: TactileOptions = {}): SystemStyleObject<Theme> {
  const { state = 'idle', depth = lip.md, radius = 20 } = options;
  const outline = outlineColor(theme);
  const base: SystemStyleObject<Theme> = {
    borderRadius: `${radius}px`,
    borderStyle: 'solid',
    borderWidth: 2,
    transition: `transform ${motion.press} ${motion.ease}, box-shadow ${motion.press} ${motion.ease}, background-color ${motion.fast}, border-color ${motion.fast}, filter ${motion.fast}`,
    '@media (hover: hover)': {
      '&:hover': { transform: 'translateY(-2px)' },
    },
    '&:active': { transform: `translateY(${depth - 1}px)` },
    '&.Mui-disabled': { cursor: 'default' },
  };

  if (state === 'selected') {
    return {
      ...base,
      bgcolor: world.main,
      color: world.onMain,
      borderColor: world.main,
      boxShadow: `0 ${depth}px 0 ${world.dark}`,
      '&:active': { transform: `translateY(${depth - 1}px)`, boxShadow: `0 1px 0 ${world.dark}` },
    };
  }

  if (state === 'done') {
    return {
      ...base,
      bgcolor: world.tint,
      color: world.text,
      borderColor: alpha(world.main, 0.45),
      boxShadow: `0 ${depth}px 0 ${alpha(world.main, 0.45)}`,
      '&:active': { transform: `translateY(${depth - 1}px)`, boxShadow: `0 1px 0 ${alpha(world.main, 0.45)}` },
    };
  }

  return {
    ...base,
    bgcolor: 'background.paper',
    color: world.text,
    borderColor: outline,
    boxShadow: `0 ${depth}px 0 ${outline}`,
    '@media (hover: hover)': {
      '&:hover': { transform: 'translateY(-2px)', borderColor: world.main, boxShadow: `0 ${depth}px 0 ${world.main}` },
    },
    '&:active': { transform: `translateY(${depth - 1}px)`, boxShadow: `0 1px 0 ${outline}` },
  };
}

export function gradient(world: ResolvedWorld, angle = 135): string {
  return `linear-gradient(${angle}deg, ${world.main} 0%, ${world.dark} 100%)`;
}

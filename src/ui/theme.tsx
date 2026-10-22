import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { colors, radii, worlds, type WorldKey } from '@kids/learning-core';

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const controls = { minTouch: 48, button: 56, input: 56 } as const;

/** Auth screens use the shared palette, with a warm storybook background. */
export const authColors = {
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  green: colors.secondary,
  amber: colors.warning,
  cream: '#FFF9EF',
  surface: colors.surface,
  text: colors.text,
  muted: colors.textSecondary,
  error: worlds.red.ink,
  errorSoft: worlds.red.soft,
  outline: colors.outline,
  radius: radii.lg,
} as const;
import { useAppStore } from '../store/useAppStore';

export interface Palette {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  text: string;
  muted: string;
  outline: string;
}

const ThemeContext = createContext<Palette | null>(null);

export function paletteFor(mode: 'light' | 'dark'): Palette {
  const dark = mode === 'dark';
  return {
    mode,
    background: dark ? colors.darkBackground : colors.background,
    surface: dark ? colors.darkSurface : colors.surface,
    text: dark ? colors.darkText : colors.text,
    muted: dark ? colors.darkTextSecondary : colors.textSecondary,
    outline: dark ? colors.darkOutline : colors.outline,
  };
}

export function AppTheme({ children }: { children: ReactNode }) {
  const setting = useAppStore((state) => state.settings.theme);
  const system = useColorScheme();
  const mode = setting === 'system' ? (system === 'dark' ? 'dark' : 'light') : setting;
  const palette = useMemo(() => paletteFor(mode), [mode]);
  return <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>;
}

export function usePalette(): Palette {
  const palette = useContext(ThemeContext);
  return palette ?? paletteFor('light');
}

export function worldColors(world: WorldKey) {
  return worlds[world];
}

export function useMotionEnabled(): boolean {
  const reduced = useAppStore((state) => state.settings.reducedMotion);
  const [system, setSystem] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setSystem(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystem);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return !(reduced || system);
}

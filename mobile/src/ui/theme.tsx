import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { colors, worlds, type WorldKey } from '@kids/learning-core';
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

export type WorldKey =
  | 'violet'
  | 'green'
  | 'sun'
  | 'orange'
  | 'pink'
  | 'blue'
  | 'teal'
  | 'gold'
  | 'slate'
  | 'red';

export interface WorldColors {
  /** Fill for tactile buttons and banners. `onMain` passes 3:1 for large bold text. */
  main: string;
  /** Bottom "lip" under tactile buttons and the deep end of gradients. */
  dark: string;
  /** Light end of gradients and highlights. */
  light: string;
  onMain: string;
  /** Tinted background for tiles and chips in light mode. */
  soft: string;
  /** Small text on `soft` or white (≥ 5.5:1). */
  ink: string;
  /** Small text on dark surfaces. */
  inkDark: string;
}

export const worlds: Record<WorldKey, WorldColors> = {
  violet: { main: '#6C4EF5', dark: '#4B2FCB', light: '#A894FF', onMain: '#FFFFFF', soft: '#EEEAFF', ink: '#4B2FCB', inkDark: '#C2B5FF' },
  green: { main: '#0F9D68', dark: '#0A6E49', light: '#4DD39D', onMain: '#FFFFFF', soft: '#E2F7EE', ink: '#0A6E49', inkDark: '#7FE3BA' },
  sun: { main: '#FFB21E', dark: '#D18700', light: '#FFD36E', onMain: '#3A2600', soft: '#FFF3D3', ink: '#7A4E00', inkDark: '#FFD36E' },
  orange: { main: '#EE5A30', dark: '#B9401C', light: '#FF9A74', onMain: '#FFFFFF', soft: '#FFEBE3', ink: '#A93A17', inkDark: '#FFB295' },
  pink: { main: '#E8448C', dark: '#B32766', light: '#FF8DBE', onMain: '#FFFFFF', soft: '#FFE5F0', ink: '#A6235C', inkDark: '#FFA9CE' },
  blue: { main: '#1F86EB', dark: '#1561B3', light: '#6DB6FF', onMain: '#FFFFFF', soft: '#E3F0FF', ink: '#13569F', inkDark: '#93C8FF' },
  teal: { main: '#0C9A97', dark: '#08706E', light: '#4FD4D0', onMain: '#FFFFFF', soft: '#DCF6F5', ink: '#08605E', inkDark: '#79E2DF' },
  gold: { main: '#F4B400', dark: '#C08A00', light: '#FFD95A', onMain: '#3A2A00', soft: '#FFF5D1', ink: '#715300', inkDark: '#FFD95A' },
  slate: { main: '#56657F', dark: '#3A4659', light: '#8E9AB1', onMain: '#FFFFFF', soft: '#EDF1F7', ink: '#3A4659', inkDark: '#C3CCDC' },
  red: { main: '#E23E57', dark: '#A82539', light: '#FF8496', onMain: '#FFFFFF', soft: '#FFE6EA', ink: '#A01F35', inkDark: '#FFA3B1' },
};

/** Rotating colors for letter, number, and xylophone tiles. */
export const rainbow: WorldKey[] = ['violet', 'orange', 'green', 'pink', 'blue', 'sun', 'teal'];

export const colors = {
  primary: worlds.violet.main,
  primaryLight: worlds.violet.light,
  primaryDark: worlds.violet.dark,
  secondary: worlds.green.main,
  secondaryLight: worlds.green.light,
  secondaryDark: worlds.green.dark,
  background: '#F6F4FF',
  surface: '#FFFFFF',
  outline: '#E7E3F7',
  outlineStrong: '#D6D0F0',
  text: '#2B2D42',
  textSecondary: '#5E6278',
  success: worlds.green.main,
  warning: worlds.sun.main,
  error: worlds.orange.main,
  star: worlds.gold.main,
  darkBackground: '#15142B',
  darkSurface: '#201F3D',
  darkOutline: '#34325A',
  darkText: '#ECEBFF',
  darkTextSecondary: '#B4B2D1',
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  full: 9999,
} as const;

export const fonts = {
  display: '"Fredoka", "Nunito", "Segoe UI", Roboto, sans-serif',
  body: '"Nunito", "Segoe UI", Roboto, sans-serif',
} as const;

export const typography = {
  fontFamily: fonts.body,
} as const;

export const motion = {
  press: '90ms',
  fast: '160ms',
  normal: '280ms',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/** Depth of the tactile "lip" below chunky buttons, in px. */
export const lip = { sm: 3, md: 5, lg: 7 } as const;

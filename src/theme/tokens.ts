export const colors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5A4BD1',
  secondary: '#00B894',
  secondaryLight: '#55EFC4',
  secondaryDark: '#00A381',
  accent1: '#FDCB6E',
  accent2: '#E17055',
  accent3: '#74B9FF',
  accent4: '#FF7675',
  accent5: '#DFE6E9',
  background: '#F8F9FD',
  surface: '#FFFFFF',
  surfaceHover: '#F0F1F8',
  text: '#2D3436',
  textSecondary: '#636E72',
  textOnPrimary: '#FFFFFF',
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',
  star: '#FDCB6E',
  darkBackground: '#1A1A2E',
  darkSurface: '#16213E',
  darkText: '#EAEAEA',
  darkTextSecondary: '#B0B0B0',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const typography = {
  fontFamily: '"Nunito", "Segoe UI", Roboto, sans-serif',
  heading: { fontWeight: 800 },
  body: { fontWeight: 600 },
  caption: { fontWeight: 400 },
} as const;

export const shadows = {
  card: '0 4px 20px rgba(108, 92, 231, 0.1)',
  cardHover: '0 8px 30px rgba(108, 92, 231, 0.2)',
  button: '0 4px 15px rgba(108, 92, 231, 0.3)',
} as const;

export const animation = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

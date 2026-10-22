import { createTheme } from '@mui/material/styles';
import { colors, radii, typography } from './tokens';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colors.primary, light: colors.primaryLight, dark: colors.primaryDark, contrastText: '#fff' },
    secondary: { main: colors.secondary, light: colors.secondaryLight, dark: colors.secondaryDark, contrastText: '#fff' },
    background: { default: colors.background, paper: colors.surface },
    text: { primary: colors.text, secondary: colors.textSecondary },
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.error },
  },
  typography: {
    fontFamily: typography.fontFamily,
    h1: { fontWeight: 800, fontSize: '2.5rem' },
    h2: { fontWeight: 800, fontSize: '2rem' },
    h3: { fontWeight: 700, fontSize: '1.5rem' },
    h4: { fontWeight: 700, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.1rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontWeight: 500, fontSize: '1rem' },
    body2: { fontWeight: 400, fontSize: '0.875rem' },
    button: { fontWeight: 700, textTransform: 'none' as const },
  },
  shape: { borderRadius: radii.md },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: `3px solid ${colors.primary}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { minWidth: 48, minHeight: 48 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radii.lg,
          padding: '10px 24px',
          fontSize: '1rem',
          fontWeight: 700,
          minHeight: 48,
        },
        colorPrimary: {
          boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)',
          '&:hover': { boxShadow: '0 6px 20px rgba(108, 92, 231, 0.4)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radii.xl,
          boxShadow: '0 4px 20px rgba(108, 92, 231, 0.08)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px rgba(108, 92, 231, 0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: radii.lg, fontWeight: 600 } },
    },
  },
});

export const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: 'dark',
    primary: { main: colors.primaryLight, light: colors.primaryLight, dark: colors.primary, contrastText: '#000' },
    secondary: { main: colors.secondaryLight, light: colors.secondaryLight, dark: colors.secondary, contrastText: '#000' },
    background: { default: colors.darkBackground, paper: colors.darkSurface },
    text: { primary: colors.darkText, secondary: colors.darkTextSecondary },
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.error },
  },
});

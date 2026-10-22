import { createTheme, alpha, type PaletteMode, type Theme } from '@mui/material/styles';
import { colors, fonts, lip, motion, radii, worlds } from './tokens';

type ButtonTone = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

function makeTheme(mode: PaletteMode): Theme {
  const dark = mode === 'dark';
  const outline = dark ? colors.darkOutline : colors.outline;
  const outlineStrong = dark ? '#433F6E' : colors.outlineStrong;

  const base = createTheme({
    palette: {
      mode,
      primary: { main: worlds.violet.main, light: worlds.violet.light, dark: worlds.violet.dark, contrastText: '#FFFFFF' },
      secondary: { main: worlds.green.main, light: worlds.green.light, dark: worlds.green.dark, contrastText: '#FFFFFF' },
      success: { main: worlds.green.main, light: worlds.green.light, dark: worlds.green.dark, contrastText: '#FFFFFF' },
      warning: { main: worlds.sun.main, light: worlds.sun.light, dark: worlds.sun.dark, contrastText: worlds.sun.onMain },
      error: { main: worlds.orange.main, light: worlds.orange.light, dark: worlds.orange.dark, contrastText: '#FFFFFF' },
      info: { main: worlds.blue.main, light: worlds.blue.light, dark: worlds.blue.dark, contrastText: '#FFFFFF' },
      background: dark
        ? { default: colors.darkBackground, paper: colors.darkSurface }
        : { default: colors.background, paper: colors.surface },
      text: dark
        ? { primary: colors.darkText, secondary: colors.darkTextSecondary }
        : { primary: colors.text, secondary: colors.textSecondary },
      divider: outline,
    },
    shape: { borderRadius: radii.md },
    typography: {
      fontFamily: fonts.body,
      h1: { fontFamily: fonts.display, fontWeight: 700, fontSize: '2.75rem', lineHeight: 1.1, letterSpacing: '-0.01em' },
      h2: { fontFamily: fonts.display, fontWeight: 700, fontSize: '2.1rem', lineHeight: 1.15 },
      h3: { fontFamily: fonts.display, fontWeight: 600, fontSize: '1.6rem', lineHeight: 1.2 },
      h4: { fontFamily: fonts.display, fontWeight: 600, fontSize: '1.3rem', lineHeight: 1.25 },
      h5: { fontFamily: fonts.display, fontWeight: 600, fontSize: '1.15rem', lineHeight: 1.3 },
      h6: { fontFamily: fonts.display, fontWeight: 600, fontSize: '1rem', lineHeight: 1.3 },
      subtitle1: { fontWeight: 700 },
      body1: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.55 },
      body2: { fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5 },
      caption: { fontWeight: 700, fontSize: '0.78rem' },
      button: { fontFamily: fonts.display, fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    },
  });

  const { palette } = base;

  return createTheme(base, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: palette.background.default },
          '::selection': { background: alpha(worlds.violet.main, 0.25) },
        },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: false },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { minWidth: 48, minHeight: 48 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ ownerState }: { ownerState: { variant?: string; color?: string } }) => {
            const tone = (ownerState.color && ownerState.color !== 'inherit' ? ownerState.color : 'primary') as ButtonTone;
            const toneColors = palette[tone];
            const common = {
              borderRadius: radii.lg,
              padding: '10px 22px',
              fontSize: '1.02rem',
              minHeight: 48,
              transition: `transform ${motion.press} ${motion.ease}, box-shadow ${motion.press} ${motion.ease}, background-color ${motion.fast}, filter ${motion.fast}`,
            };
            if (ownerState.variant === 'contained') {
              return {
                ...common,
                boxShadow: `0 ${lip.md}px 0 ${toneColors.dark}`,
                '&:hover': { backgroundColor: toneColors.main, boxShadow: `0 ${lip.md}px 0 ${toneColors.dark}`, filter: 'brightness(1.06)' },
                '&:active': { transform: `translateY(${lip.md - 1}px)`, boxShadow: `0 1px 0 ${toneColors.dark}` },
                '&.Mui-disabled': { boxShadow: 'none', backgroundColor: alpha(palette.text.primary, 0.1), color: alpha(palette.text.primary, 0.4) },
              };
            }
            if (ownerState.variant === 'outlined') {
              return {
                ...common,
                border: `2px solid ${outlineStrong}`,
                backgroundColor: palette.background.paper,
                color: dark ? palette.text.primary : toneColors.dark,
                boxShadow: `0 ${lip.sm + 1}px 0 ${outlineStrong}`,
                '&:hover': { border: `2px solid ${toneColors.main}`, backgroundColor: alpha(toneColors.main, 0.06), boxShadow: `0 ${lip.sm + 1}px 0 ${toneColors.main}` },
                '&:active': { transform: `translateY(${lip.sm}px)`, boxShadow: `0 1px 0 ${outlineStrong}` },
                '&.Mui-disabled': { border: `2px solid ${outline}`, boxShadow: 'none' },
              };
            }
            return { ...common, fontWeight: 700 };
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: radii.xl,
            border: `2px solid ${outline}`,
            backgroundColor: palette.background.paper,
            boxShadow: dark ? 'none' : `0 10px 30px ${alpha(worlds.violet.dark, 0.06)}`,
            overflow: 'hidden',
          },
        },
      },
      MuiCardActionArea: {
        styleOverrides: {
          focusHighlight: { opacity: 0 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: radii.full, fontWeight: 800, fontFamily: fonts.body, height: 36, paddingInline: 4 },
          outlined: { borderWidth: 2, borderColor: outline, backgroundColor: palette.background.paper },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            gap: 8,
            backgroundColor: 'transparent',
            '& .MuiToggleButtonGroup-grouped': {
              border: `2px solid ${outlineStrong}`,
              borderRadius: `${radii.full}px !important`,
              margin: 0,
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            minHeight: 48,
            paddingInline: 18,
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: '0.98rem',
            textTransform: 'none',
            color: palette.text.primary,
            backgroundColor: palette.background.paper,
            boxShadow: `0 ${lip.sm}px 0 ${outlineStrong}`,
            transition: `transform ${motion.press}, box-shadow ${motion.press}, background-color ${motion.fast}`,
            '&:hover': { backgroundColor: alpha(worlds.violet.main, 0.06) },
            '&:active': { transform: `translateY(${lip.sm - 1}px)`, boxShadow: `0 1px 0 ${outlineStrong}` },
            '&.Mui-selected, &.Mui-selected:hover': {
              backgroundColor: worlds.violet.main,
              color: '#FFFFFF',
              borderColor: `${worlds.violet.main} !important`,
              boxShadow: `0 ${lip.sm}px 0 ${worlds.violet.dark}`,
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: 14, borderRadius: radii.full, backgroundColor: dark ? alpha('#FFFFFF', 0.1) : alpha(worlds.violet.main, 0.1) },
          bar: { borderRadius: radii.full },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { width: 64, height: 40, padding: 8 },
          switchBase: {
            padding: 11,
            '&.Mui-checked': { transform: 'translateX(24px)', color: '#FFFFFF' },
            '&.Mui-checked + .MuiSwitch-track': { opacity: 1, backgroundColor: worlds.green.main },
          },
          thumb: { width: 18, height: 18, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
          track: { borderRadius: 20, opacity: 1, backgroundColor: dark ? '#4A476F' : '#C9C5DE' },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: { height: 10 },
          thumb: { width: 26, height: 26, border: '4px solid #FFFFFF', boxShadow: `0 2px 8px ${alpha(worlds.violet.dark, 0.35)}` },
          rail: { opacity: 1, backgroundColor: dark ? '#3A3863' : colors.outline },
          markLabel: { fontWeight: 700 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: radii.xl, border: `2px solid ${outline}`, backgroundImage: 'none' },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontFamily: fonts.display, fontWeight: 600, fontSize: '1.35rem' } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: radii.lg, fontWeight: 600 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: radii.md, '& fieldset': { borderWidth: 2, borderColor: outlineStrong } },
        },
      },
      MuiMenu: {
        styleOverrides: { paper: { borderRadius: radii.md } },
      },
    },
  });
}

export const lightTheme = makeTheme('light');
export const darkTheme = makeTheme('dark');

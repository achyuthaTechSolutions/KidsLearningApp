import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { colors, fonts, worlds } from '../../theme/tokens';

export type MascotMood = 'happy' | 'cheer' | 'think';

interface MascotProps {
  size?: number;
  mood?: MascotMood;
  wave?: boolean;
  float?: boolean;
  /** When set, the mascot is announced as an image. Otherwise it is decorative. */
  label?: string;
}

const body = worlds.violet.main;
const bodyDark = worlds.violet.dark;
const belly = worlds.violet.light;
const face = worlds.violet.soft;
const beak = worlds.sun.main;
const beakDark = worlds.sun.dark;
const ink = colors.text;

/** Avi, the app's guide. Drawn here so it is bundled and needs no licence. */
export default function Mascot({ size = 120, mood = 'happy', wave = false, float = true, label }: MascotProps) {
  const look = mood === 'think' ? { dx: 3, dy: -4 } : { dx: 0, dy: 1 };
  const cheer = mood === 'cheer';
  const leftWing = cheer ? 'rotate(140 24 70)' : 'rotate(14 24 70)';
  const rightWing = cheer || wave ? 'rotate(-140 96 70)' : 'rotate(-14 96 70)';

  return (
    <Box
      component="svg"
      viewBox="0 0 120 132"
      width={size}
      height={(size * 132) / 120}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      sx={{
        display: 'block',
        overflow: 'visible',
        flexShrink: 0,
        animation: float ? 'kl-float 4.5s ease-in-out infinite' : 'none',
      }}
    >
      <ellipse cx="60" cy="126" rx="30" ry="5" fill={alpha(ink, 0.12)} />

      <g transform={leftWing}>
        <g style={cheer ? { animation: 'kl-wave 2.4s ease-in-out infinite', transformOrigin: '24px 70px' } : undefined}>
          <ellipse cx="24" cy="88" rx="10" ry="19" fill={bodyDark} />
        </g>
      </g>
      <g transform={rightWing}>
        <g style={wave || cheer ? { animation: 'kl-wave 2.4s ease-in-out infinite', transformOrigin: '96px 70px' } : undefined}>
          <ellipse cx="96" cy="88" rx="10" ry="19" fill={bodyDark} />
        </g>
      </g>

      <polygon points="24,44 28,18 46,32" fill={bodyDark} />
      <polygon points="96,44 92,18 74,32" fill={bodyDark} />

      <ellipse cx="60" cy="74" rx="42" ry="46" fill={body} />
      <ellipse cx="60" cy="90" rx="27" ry="27" fill={belly} />
      <path d="M48 86 q4 4 8 0 M64 86 q4 4 8 0 M54 98 q4 4 8 0" fill="none" stroke={alpha(bodyDark, 0.45)} strokeWidth="2.5" strokeLinecap="round" />

      <circle cx="44" cy="60" r="20" fill={face} />
      <circle cx="76" cy="60" r="20" fill={face} />

      {cheer ? (
        <g fill="none" stroke={ink} strokeWidth="4.5" strokeLinecap="round">
          <path d="M35 62 Q44 51 53 62" />
          <path d="M67 62 Q76 51 85 62" />
        </g>
      ) : (
        <g style={{ animation: 'kl-blink 5s ease-in-out infinite', transformOrigin: '60px 60px' }}>
          <circle cx="44" cy="60" r="13" fill="#FFFFFF" />
          <circle cx="76" cy="60" r="13" fill="#FFFFFF" />
          <circle cx={44 + look.dx} cy={60 + look.dy} r="7.5" fill={ink} />
          <circle cx={76 + look.dx} cy={60 + look.dy} r="7.5" fill={ink} />
          <circle cx={46.5 + look.dx} cy={57 + look.dy} r="2.6" fill="#FFFFFF" />
          <circle cx={78.5 + look.dx} cy={57 + look.dy} r="2.6" fill="#FFFFFF" />
        </g>
      )}

      <circle cx="30" cy="78" r="5.5" fill={worlds.pink.light} opacity="0.7" />
      <circle cx="90" cy="78" r="5.5" fill={worlds.pink.light} opacity="0.7" />
      <path d="M53 72 L67 72 L60 82 Z" fill={beak} stroke={beakDark} strokeWidth="1.5" strokeLinejoin="round" />

      <ellipse cx="48" cy="120" rx="8" ry="4.5" fill={beak} />
      <ellipse cx="72" cy="120" rx="8" ry="4.5" fill={beak} />

      <path d="M42 24 L42 32 Q60 39 78 32 L78 24 Z" fill="#3A3D5C" />
      <polygon points="60,8 90,19 60,30 30,19" fill={ink} />
      <path d="M60 19 L84 23 L84 35" fill="none" stroke={worlds.gold.main} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="84" cy="37" r="3.5" fill={worlds.gold.main} />
    </Box>
  );
}

interface SpeechBubbleProps {
  children: ReactNode;
  /** Which side the tail points to. */
  tail?: 'left' | 'bottom';
}

export function SpeechBubble({ children, tail = 'left' }: SpeechBubbleProps) {
  const theme = useTheme();
  const bg = theme.palette.background.paper;
  const border = theme.palette.mode === 'dark' ? colors.darkOutline : colors.outline;
  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: bg,
        border: `2px solid ${border}`,
        borderRadius: '22px',
        px: 2.25,
        py: 1.5,
        boxShadow: `0 6px 0 ${border}`,
        animation: 'kl-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          width: 0,
          height: 0,
          borderStyle: 'solid',
        },
        ...(tail === 'left'
          ? {
              '&::before': { left: -14, top: 22, borderWidth: '9px 14px 9px 0', borderColor: `transparent ${border} transparent transparent` },
              '&::after': { left: -10, top: 24, borderWidth: '7px 11px 7px 0', borderColor: `transparent ${bg} transparent transparent` },
            }
          : {
              '&::before': { bottom: -14, left: 32, borderWidth: '14px 9px 0 9px', borderColor: `${border} transparent transparent transparent` },
              '&::after': { bottom: -10, left: 34, borderWidth: '11px 7px 0 7px', borderColor: `${bg} transparent transparent transparent` },
            }),
      }}
    >
      <Typography component="div" sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: { xs: '1.02rem', md: '1.15rem' }, lineHeight: 1.35 }}>
        {children}
      </Typography>
    </Box>
  );
}

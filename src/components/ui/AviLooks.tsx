import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { blocks, garden, map } from '../../theme/looks';

/*
 * Avi in the three redesign looks, drawn from the redesign canvas. Each takes the
 * same props as the Classic owl, so every screen that shows Avi shows the look's Avi.
 */

export type AviMood = 'happy' | 'cheer' | 'think';

export interface AviProps {
  size?: number;
  mood?: AviMood;
  wave?: boolean;
  float?: boolean;
  /** When set, Avi is announced as an image. Otherwise Avi is decorative. */
  label?: string;
}

function Frame({ viewW, viewH, size, float, label, children }: { viewW: number; viewH: number; size: number; float: boolean; label?: string; children: ReactNode }) {
  return (
    <Box
      component="svg"
      viewBox={`0 0 ${viewW} ${viewH}`}
      width={size}
      height={(size * viewH) / viewW}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      sx={{ display: 'block', overflow: 'visible', flexShrink: 0, animation: float ? 'kl-float 4.5s ease-in-out infinite' : 'none' }}
    >
      {children}
    </Box>
  );
}

const waving = (x: number, y: number) => ({ animation: 'kl-wave 2.4s ease-in-out infinite', transformOrigin: `${x}px ${y}px` });

/** Storybook Garden: a leaf-green owl with a cream belly. */
export function GardenOwl({ size = 120, mood = 'happy', wave = false, float = true, label }: AviProps) {
  const cheer = mood === 'cheer';
  const look = mood === 'think' ? 2 : 0;
  return (
    <Frame viewW={96} viewH={104} size={size} float={float} label={label}>
      <ellipse cx="48" cy="98" rx="30" ry="5" fill="#EADFC8" />
      <path d="M18 40 C18 18 78 18 78 40 L78 74 C78 92 18 92 18 74 Z" fill={garden.leaf} />
      <path d="M18 30 L26 14 L34 28 Z" fill={garden.leaf} />
      <path d="M78 30 L70 14 L62 28 Z" fill={garden.leaf} />
      <ellipse cx="48" cy="68" rx="20" ry="18" fill={garden.sand} />
      <path d="M38 62 q4 3 8 0 M46 70 q4 3 8 0 M38 76 q4 3 8 0 M50 62 q4 3 8 0" stroke="#D9C49A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="42" r="12" fill="#FFFFFF" />
      <circle cx="60" cy="42" r="12" fill="#FFFFFF" />
      {cheer ? (
        <g fill="none" stroke={garden.indigo} strokeWidth="3.5" strokeLinecap="round">
          <path d="M29 44 Q36 36 43 44" />
          <path d="M53 44 Q60 36 67 44" />
        </g>
      ) : (
        <g style={{ animation: 'kl-blink 5s ease-in-out infinite', transformOrigin: '48px 42px' }}>
          <circle cx={37 + look} cy={43 - look} r="6" fill={garden.indigo} />
          <circle cx={59 + look} cy={43 - look} r="6" fill={garden.indigo} />
          <circle cx={39 + look} cy={41 - look} r="2" fill="#FFFFFF" />
          <circle cx={61 + look} cy={41 - look} r="2" fill="#FFFFFF" />
        </g>
      )}
      <path d="M44 52 L48 58 L52 52 Z" fill={garden.marigold} />
      {/* Right wing: raised to wave or cheer, otherwise resting. */}
      <g style={wave || cheer ? waving(78, 56) : undefined}>
        {wave || cheer
          ? <path d="M78 56 C92 44 94 30 88 24" stroke={garden.leaf} strokeWidth="9" fill="none" strokeLinecap="round" />
          : <path d="M78 58 C86 64 84 76 78 80" stroke={garden.leafDark} strokeWidth="8" fill="none" strokeLinecap="round" />}
      </g>
      {cheer
        ? <path d="M18 56 C4 44 2 30 8 24" stroke={garden.leaf} strokeWidth="9" fill="none" strokeLinecap="round" />
        : <path d="M18 58 C10 64 12 76 18 80" stroke={garden.leafDark} strokeWidth="8" fill="none" strokeLinecap="round" />}
      <path d="M38 92 l-4 6 M44 92 l0 6 M52 92 l0 6 M58 92 l4 6" stroke={garden.marigold} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

/** Bright Blocks: a round, sunny friend with a thick ink outline. */
export function SunnyAvi({ size = 120, mood = 'happy', wave = false, float = true, label }: AviProps) {
  const cheer = mood === 'cheer';
  const look = mood === 'think' ? 2 : 0;
  return (
    <Frame viewW={92} viewH={92} size={size} float={float} label={label}>
      <g style={wave || cheer ? { animation: 'kl-wiggle 3s ease-in-out infinite', transformOrigin: '46px 46px' } : undefined}>
        <path
          d="M46 6 c4 0 6 6 10 8 c4 2 10 -1 13 2 c3 3 0 9 2 13 c2 4 8 6 8 10 c0 4 -6 6 -8 10 c-2 4 1 10 -2 13 c-3 3 -9 0 -13 2 c-4 2 -6 8 -10 8 c-4 0 -6 -6 -10 -8 c-4 -2 -10 1 -13 -2 c-3 -3 0 -9 -2 -13 c-2 -4 -8 -6 -8 -10 c0 -4 6 -6 8 -10 c2 -4 -1 -10 2 -13 c3 -3 9 0 13 -2 c4 -2 6 -8 10 -8 z"
          fill={blocks.yellow}
          stroke={blocks.ink}
          strokeWidth="3"
        />
      </g>
      {cheer ? (
        <g fill="none" stroke={blocks.ink} strokeWidth="3.5" strokeLinecap="round">
          <path d="M30 43 Q36 36 42 43" />
          <path d="M52 43 Q58 36 64 43" />
        </g>
      ) : (
        <g style={{ animation: 'kl-blink 5s ease-in-out infinite', transformOrigin: '46px 42px' }}>
          <circle cx={36 + look} cy={42 - look} r="7" fill={blocks.ink} />
          <circle cx={58 + look} cy={42 - look} r="7" fill={blocks.ink} />
          <circle cx={38 + look} cy={40 - look} r="2.4" fill="#FFFFFF" />
          <circle cx={60 + look} cy={40 - look} r="2.4" fill="#FFFFFF" />
        </g>
      )}
      <path d={cheer ? 'M34 54 q12 16 24 0 z' : 'M36 56 q11 10 22 0'} stroke={blocks.ink} strokeWidth="3.5" fill={cheer ? blocks.ink : 'none'} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="54" r="4" fill={blocks.cheek} />
      <circle cx="66" cy="54" r="4" fill={blocks.cheek} />
    </Frame>
  );
}

/** Adventure Map: a little elephant explorer in an orange cap. */
export function ElephantAvi({ size = 120, mood = 'happy', wave = false, float = true, label }: AviProps) {
  const cheer = mood === 'cheer';
  const look = mood === 'think' ? 1.5 : 0;
  return (
    <Frame viewW={86} viewH={86} size={size} float={float} label={label}>
      <ellipse cx="43" cy="80" rx="24" ry="4" fill={map.deep} opacity="0.2" />
      <ellipse cx="44" cy="52" rx="24" ry="20" fill={map.elephant} />
      <circle cx="36" cy="34" r="18" fill={map.elephantLight} />
      <ellipse cx="20" cy="34" rx="10" ry="13" fill={map.elephant} />
      {/* The trunk curls up to wave or cheer, and hangs down otherwise. */}
      <g style={wave || cheer ? waving(30, 44) : undefined}>
        <path d={wave || cheer ? 'M30 44 c-10 -2 -16 -12 -12 -20' : 'M28 44 c-6 8 -6 18 2 20'} stroke={map.elephantLight} strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
      {cheer ? (
        <path d="M36 31 Q40 26 44 31" stroke={map.deep} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <g style={{ animation: 'kl-blink 5s ease-in-out infinite', transformOrigin: '40px 30px' }}>
          <circle cx={40 + look} cy={30 - look} r="3.5" fill={map.deep} />
          <circle cx={41 + look} cy={29 - look} r="1.2" fill="#FFFFFF" />
        </g>
      )}
      <circle cx="46" cy="38" r="3" fill="#F7A9A0" />
      <path d="M22 18 q14 -14 30 -2 l-4 4 q-10 -6 -22 0z" fill={map.orange} />
      <rect x="30" y="66" width="8" height="10" rx="3" fill={map.elephant} />
      <rect x="50" y="66" width="8" height="10" rx="3" fill={map.elephant} />
    </Frame>
  );
}

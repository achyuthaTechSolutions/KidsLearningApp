import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import Illustration from '../../../components/ui/Illustration';
import { characters } from '../content/characters';
import { backdropArt, characterArt } from '../assets';
import type { BackdropId, Expression, Lang, SceneCharacter, SceneProp } from '../engine/types';

/*
 * Picture-book backdrops drawn as layered SVG, so they stay sharp on any screen,
 * cost no download, and never contain text or answers. Final painted art can
 * replace a backdrop by id without changing story data.
 */

const palette = {
  sun: '#F6B33B',
  sunGlow: '#FFE2A1',
  earth: '#C9773A',
  earthDark: '#9C5326',
  grass: '#5FA147',
  grassDark: '#3F7E33',
  leaf: '#2F7A4B',
  leafLight: '#4E9E5F',
  trunk: '#7A4A2A',
  water: '#3E8FC8',
  waterLight: '#7CC3EA',
  stone: '#9C8E7E',
  maroon: '#8A2D3B',
  gold: '#E2A83A',
  cream: '#FFF6E3',
};

function Tree({ x, y, scale = 1, light = false }: { x: number; y: number; scale?: number; light?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-6" y="-10" width="12" height="60" rx="4" fill={palette.trunk} />
      <circle cx="0" cy="-30" r="34" fill={light ? palette.leafLight : palette.leaf} />
      <circle cx="-26" cy="-14" r="22" fill={light ? palette.leaf : palette.leafLight} />
      <circle cx="26" cy="-14" r="22" fill={light ? palette.leaf : palette.leafLight} />
      <circle cx="-10" cy="-44" r="6" fill={palette.gold} opacity="0.8" />
      <circle cx="14" cy="-24" r="5" fill={palette.gold} opacity="0.8" />
    </g>
  );
}

/** A border band of diamonds and dots, in the spirit of painted storybook frames. */
function Border() {
  return (
    <g>
      <rect x="0" y="372" width="800" height="28" fill={palette.maroon} />
      {Array.from({ length: 27 }, (_, i) => (
        <g key={i} transform={`translate(${i * 30 + 15} 386)`}>
          <path d="M0 -9 L9 0 L0 9 L-9 0 Z" fill={palette.gold} />
          <circle r="2.6" fill={palette.maroon} />
        </g>
      ))}
    </g>
  );
}

function Sky({ warm }: { warm: boolean }) {
  const id = warm ? 'sky-warm' : 'sky-cool';
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={warm ? '#FFD58A' : '#8FD0F2'} />
          <stop offset="1" stopColor={warm ? '#FFF0C9' : '#E4F5FF'} />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill={`url(#${id})`} />
    </>
  );
}

function Cloud({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="#FFFFFF" opacity="0.9">
      <ellipse cx="0" cy="0" rx="40" ry="16" />
      <ellipse cx="-24" cy="4" rx="22" ry="12" />
      <ellipse cx="26" cy="5" rx="24" ry="12" />
    </g>
  );
}

function River({ y }: { y: number }) {
  return (
    <g>
      <path d={`M0 ${y} C200 ${y - 20} 400 ${y + 20} 800 ${y - 10} L800 372 L0 372 Z`} fill={palette.water} />
      {[120, 330, 560, 700].map((x, i) => (
        <path key={x} d={`M${x} ${y + 40 + (i % 2) * 22} q14 -8 28 0 q14 8 28 0`} stroke={palette.waterLight} strokeWidth="4" fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

export function Backdrop({ id }: { id: BackdropId }) {
  const warm = id === 'dry-field';
  return (
    <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden focusable="false" style={{ display: 'block' }}>
      <Sky warm={warm} />
      {id !== 'sky' && <circle cx={warm ? 660 : 690} cy="80" r={warm ? 46 : 34} fill={palette.sun} stroke={palette.sunGlow} strokeWidth="14" />}
      {(id === 'sky' || id === 'meadow' || id === 'river') && <><Cloud x={180} y={80} /><Cloud x={470} y={60} /></>}
      {id === 'sky' && <><Cloud x={640} y={150} /><Cloud x={300} y={210} /><path d="M0 330 Q200 300 400 330 T800 320 L800 372 L0 372 Z" fill={palette.grass} /></>}

      {id === 'dry-field' && (
        <>
          <path d="M0 250 Q150 210 300 245 T620 235 T800 240 L800 372 L0 372 Z" fill="#E7B66F" />
          <path d="M0 290 Q220 270 420 292 T800 286 L800 372 L0 372 Z" fill={palette.earth} />
          {[[90, 320], [260, 340], [480, 318], [640, 344]].map(([x, y]) => (
            <path key={x} d={`M${x} ${y} l14 8 l-6 10 l16 6`} stroke={palette.earthDark} strokeWidth="3" fill="none" strokeLinecap="round" />
          ))}
          <Tree x={640} y={240} scale={1.25} light />
        </>
      )}

      {(id === 'forest' || id === 'forest-well') && (
        <>
          <path d="M0 220 Q200 170 400 210 T800 200 L800 372 L0 372 Z" fill={palette.grassDark} />
          {[60, 180, 520, 700].map((x, i) => <Tree key={x} x={x} y={210 + (i % 2) * 14} scale={0.9 + (i % 2) * 0.2} light={i % 2 === 0} />)}
          <path d="M0 280 Q260 250 520 282 T800 276 L800 372 L0 372 Z" fill={palette.grass} />
          {id === 'forest-well' && (
            <g transform="translate(560 250)">
              <ellipse cx="0" cy="58" rx="74" ry="18" fill={palette.stone} />
              <rect x="-70" y="0" width="140" height="58" fill={palette.stone} />
              {[0, 1, 2].map((row) => Array.from({ length: 4 }, (_, i) => (
                <rect key={`${row}-${i}`} x={-68 + i * 35 + (row % 2) * 16} y={2 + row * 19} width="30" height="15" rx="3" fill="#B3A493" />
              )))}
              <ellipse cx="0" cy="0" rx="70" ry="16" fill="#3B4C63" />
              <ellipse cx="0" cy="2" rx="58" ry="10" fill={palette.water} />
            </g>
          )}
        </>
      )}

      {id === 'meadow' && (
        <>
          <path d="M0 240 Q200 200 420 236 T800 226 L800 372 L0 372 Z" fill={palette.grassDark} />
          <path d="M0 280 Q240 256 480 284 T800 274 L800 372 L0 372 Z" fill={palette.grass} />
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={30 + i * 56} cy={310 + (i % 3) * 18} r="6" fill={i % 2 ? '#F29BC1' : palette.gold} />
          ))}
          <Tree x={110} y={236} scale={1.1} />
        </>
      )}

      {(id === 'river' || id === 'tree-river') && (
        <>
          <path d="M0 230 Q200 200 400 228 T800 220 L800 300 L0 300 Z" fill={palette.grass} />
          <River y={262} />
          {id === 'tree-river' && (
            <g>
              <rect x="70" y="120" width="22" height="160" rx="8" fill={palette.trunk} />
              <path d="M90 170 Q170 140 230 150" stroke={palette.trunk} strokeWidth="12" fill="none" strokeLinecap="round" />
              <circle cx="80" cy="110" r="70" fill={palette.leaf} />
              <circle cx="190" cy="140" r="46" fill={palette.leafLight} />
              {[[60, 100], [100, 80], [180, 130], [120, 130]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="7" fill="#6B2F6E" />)}
            </g>
          )}
        </>
      )}

      <Border />
    </svg>
  );
}

const expressionMotion: Record<Expression, string> = {
  idle: 'kl-float 4s ease-in-out infinite',
  speaking: 'kl-bob 0.9s ease-in-out infinite',
  thinking: 'kl-tilt 2.4s ease-in-out infinite',
  happy: 'kl-hop 1.1s ease-in-out infinite',
  surprised: 'kl-pop-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
  sad: 'kl-droop 2.6s ease-in-out infinite',
  action: 'kl-hop 0.7s ease-in-out infinite',
};

const expressionMark: Partial<Record<Expression, string>> = {
  thinking: '💭',
  happy: '✨',
  surprised: '❗',
  sad: '💧',
};

const positionX: Record<SceneCharacter['position'], string> = { left: '22%', center: '50%', right: '78%' };

interface StageProps {
  backdrop: BackdropId;
  cast: SceneCharacter[];
  props?: SceneProp[];
  speaker?: string;
  speakerExpression?: Expression;
  lang: Lang;
  sceneKey: string;
  /** Extra layers, such as an activity's pot, drawn over the backdrop. */
  children?: ReactNode;
}

/** Bundled painted art for this backdrop if there is any, otherwise the drawn one. */
function BackdropArt({ id }: { id: BackdropId }) {
  const url = backdropArt(id);
  if (!url) return <Backdrop id={id} />;
  return <Box component="img" src={url} alt="" draggable={false} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
}

/** Bundled character art if there is any, otherwise the development picture. */
function CharacterArt({ id }: { id: SceneCharacter['id'] }) {
  const url = characterArt(id);
  if (!url) return <Illustration emoji={characters[id].emoji} />;
  return <Box component="img" src={url} alt="" draggable={false} sx={{ height: '1em', width: 'auto', display: 'block' }} />;
}

/** The scene: backdrop, props, and characters reacting to what is happening. */
export function Stage({ backdrop, cast, props = [], speaker, speakerExpression, lang, sceneKey, children }: StageProps) {
  const label = cast.map((member) => characters[member.id].name[lang]).join(', ');
  return (
    <Box
      key={sceneKey}
      role="img"
      aria-label={label}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: { xs: '4 / 3', sm: '16 / 9' },
        maxHeight: { xs: '42vh', md: '56vh' },
        borderRadius: { xs: '22px', md: '30px' },
        overflow: 'hidden',
        border: `4px solid ${palette.maroon}`,
        boxShadow: `0 8px 0 ${palette.gold}`,
        animation: 'kl-scene-in 500ms ease-out both',
        bgcolor: palette.cream,
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0 }}><BackdropArt id={backdrop} /></Box>
      {props.map((prop) => (
        <Box
          key={prop.id}
          aria-hidden
          sx={{ position: 'absolute', left: `${prop.x}%`, bottom: '12%', transform: 'translateX(-50%)', fontSize: prop.size === 'lg' ? 'clamp(48px, 11vw, 110px)' : prop.size === 'sm' ? 'clamp(24px, 5vw, 48px)' : 'clamp(36px, 8vw, 80px)', lineHeight: 1 }}
        >
          <Illustration emoji={prop.emoji} />
        </Box>
      ))}
      {cast.map((member) => {
        const speaking = speaker === member.id;
        const expression = speaking ? speakerExpression ?? 'speaking' : member.expression ?? 'idle';
        const mark = expressionMark[expression];
        return (
          <Box
            key={member.id}
            aria-hidden
            data-expression={expression}
            sx={{
              position: 'absolute',
              left: positionX[member.position],
              bottom: '11%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(56px, 13vw, 132px)',
              lineHeight: 1,
              filter: speaking ? `drop-shadow(0 0 10px ${palette.cream})` : 'drop-shadow(0 6px 4px rgba(0,0,0,0.18))',
            }}
          >
            <Box sx={{ animation: expressionMotion[expression], transformOrigin: 'bottom center' }}>
              <CharacterArt id={member.id} />
            </Box>
            {mark && (
              <Box sx={{ position: 'absolute', top: '-12%', right: '-18%', fontSize: '0.38em', animation: 'kl-pop-in 400ms both' }}>
                <Illustration emoji={mark} />
              </Box>
            )}
          </Box>
        );
      })}
      {children}
    </Box>
  );
}

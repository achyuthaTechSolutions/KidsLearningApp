import { useRef, useState, type PointerEvent } from 'react';
import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { worlds } from '../../theme/tokens';
import { strokePath, strokesFor, type Point } from './strokes';
import { appendPoint, scoreTrace, startMarkers, toBoxPoint, type Difficulty, type TraceScore } from './tracing';

interface Props {
  letter: string;
  difficulty: Difficulty;
  /** Change to replay the stroke demonstration. Zero shows none. */
  demo: number;
  /** Called after each finished stroke. */
  onScore: (score: TraceScore) => void;
  disabled?: boolean;
}

/**
 * The drawing area. Drawing state stays here, so pointer moves only re-render this
 * SVG and never the whole game screen. The letter is scored when a stroke ends.
 */
export default function TracingSurface({ letter, difficulty, demo, onScore, disabled }: Props) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const svgRef = useRef<SVGSVGElement>(null);
  const activePointer = useRef<number | null>(null);
  const [ink, setInkState] = useState<Point[][]>([]);
  const inkRef = useRef<Point[][]>([]);
  const setInk = (update: (current: Point[][]) => Point[][]) => {
    inkRef.current = update(inkRef.current);
    setInkState(inkRef.current);
  };
  const strokes = strokesFor(letter);

  const pointFor = (event: PointerEvent<SVGSVGElement>): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    return toBoxPoint(event.clientX, event.clientY, svg.getBoundingClientRect());
  };

  const handleDown = (event: PointerEvent<SVGSVGElement>) => {
    if (disabled || activePointer.current !== null) return;
    const point = pointFor(event);
    if (!point) return;
    event.preventDefault();
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setInk((current) => [...current, [point]]);
  };

  const handleMove = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return;
    const point = pointFor(event);
    if (!point) return;
    setInk((current) => {
      if (current.length === 0) return current;
      const last = current[current.length - 1];
      const next = appendPoint(last, point);
      return next === last ? current : [...current.slice(0, -1), next];
    });
  };

  const finish = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onScore(scoreTrace(letter, inkRef.current, difficulty));
  };

  const guide = dark ? alpha('#FFFFFF', 0.14) : alpha(worlds.green.main, 0.14);
  const centre = dark ? alpha('#FFFFFF', 0.55) : alpha(worlds.slate.dark, 0.55);
  const inkColor = dark ? worlds.sun.light : worlds.violet.main;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 420,
        mx: 'auto',
        aspectRatio: '1 / 1',
        borderRadius: '28px',
        bgcolor: 'background.paper',
        border: `3px dashed ${alpha(worlds.green.main, 0.45)}`,
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        role="img"
        aria-label={`Tracing area for the letter ${letter}. ${strokes.length} ${strokes.length === 1 ? 'stroke' : 'strokes'}. Start at the green dot with number 1.`}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        style={{ display: 'block', touchAction: 'none', cursor: disabled ? 'default' : 'crosshair', userSelect: 'none' }}
      >
        <line x1="4" y1="40" x2="96" y2="40" stroke={centre} strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5" />
        <line x1="4" y1="90" x2="96" y2="90" stroke={centre} strokeWidth="0.5" opacity="0.6" />
        {strokes.map((stroke, i) => (
          <path key={`g${i}`} d={strokePath(stroke)} fill="none" stroke={guide} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {strokes.map((stroke, i) => (
          <path key={`c${i}`} d={strokePath(stroke)} fill="none" stroke={centre} strokeWidth="1" strokeDasharray="2.5 2.5" strokeLinecap="round" />
        ))}
        {demo > 0 && strokes.map((stroke, i) => (
          <path
            key={`d${demo}-${i}`}
            d={strokePath(stroke)}
            pathLength={1}
            fill="none"
            stroke={worlds.orange.main}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1"
            style={{ animation: `kl-draw 1.1s ease-in-out ${i * 1.25}s both` }}
          />
        ))}
        {ink.map((points, i) => (
          <polyline
            key={`i${i}`}
            points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke={inkColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {startMarkers(strokes).reverse().map(({ point, angle, number }) => (
          <g key={`s${number}`} aria-hidden>
            <g transform={`translate(${point.x} ${point.y}) rotate(${angle})`}>
              <path d="M7 -3 L12 0 L7 3" fill="none" stroke={worlds.green.dark} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <circle cx={point.x} cy={point.y} r="4.4" fill={worlds.green.main} stroke="#FFFFFF" strokeWidth="1" />
            <text x={point.x} y={point.y + 1.9} textAnchor="middle" fontSize="5.5" fontWeight="800" fill="#FFFFFF" fontFamily="Nunito, sans-serif">{number}</text>
          </g>
        ))}
      </svg>
    </Box>
  );
}

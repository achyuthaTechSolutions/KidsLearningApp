/**
 * Simple stroke guides for tracing, drawn in a 100 × 100 box (y grows downward).
 * Each letter is a list of strokes in the usual writing order, and each stroke is
 * a polyline that starts where a child should start. These are teaching guides,
 * not a font: they favour clear, simple shapes over typographic detail.
 */
export type Point = { x: number; y: number };
export type Stroke = Point[];

function line(...coords: number[]): Stroke {
  const points: Stroke = [];
  for (let i = 0; i < coords.length; i += 2) points.push({ x: coords[i], y: coords[i + 1] });
  return points;
}

/** An elliptical arc. Angles are degrees, 0 = right, 90 = down; `to` may be below `from`. */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number): Stroke {
  const steps = Math.max(6, Math.ceil(Math.abs(to - from) / 10));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });
}

function join(...parts: Stroke[]): Stroke {
  return parts.flat();
}

export const uppercaseStrokes: Record<string, Stroke[]> = {
  A: [line(50, 10, 20, 90), line(50, 10, 80, 90), line(32, 60, 68, 60)],
  B: [line(25, 10, 25, 90), join(line(25, 10, 52, 10), arc(52, 30, 20, 20, -90, 90), line(52, 50, 25, 50)), join(line(25, 50, 56, 50), arc(56, 70, 20, 20, -90, 90), line(56, 90, 25, 90))],
  C: [arc(55, 50, 30, 40, -40, -320)],
  D: [line(25, 10, 25, 90), join(line(25, 10, 45, 10), arc(45, 50, 30, 40, -90, 90), line(45, 90, 25, 90))],
  E: [line(25, 10, 25, 90), line(25, 10, 75, 10), line(25, 50, 65, 50), line(25, 90, 75, 90)],
  F: [line(25, 10, 25, 90), line(25, 10, 75, 10), line(25, 50, 65, 50)],
  G: [arc(52, 50, 30, 40, -40, -360), line(60, 50, 82, 50)],
  H: [line(25, 10, 25, 90), line(75, 10, 75, 90), line(25, 50, 75, 50)],
  I: [line(50, 10, 50, 90), line(30, 10, 70, 10), line(30, 90, 70, 90)],
  J: [join(line(65, 10, 65, 70), arc(45, 70, 20, 20, 0, 180)), line(45, 10, 82, 10)],
  K: [line(25, 10, 25, 90), line(75, 10, 25, 58), line(40, 44, 75, 90)],
  L: [line(25, 10, 25, 90, 75, 90)],
  M: [line(20, 90, 20, 10, 50, 60, 80, 10, 80, 90)],
  N: [line(25, 90, 25, 10, 75, 90, 75, 10)],
  O: [arc(50, 50, 30, 40, -90, -450)],
  P: [line(25, 10, 25, 90), join(line(25, 10, 55, 10), arc(55, 30, 20, 20, -90, 90), line(55, 50, 25, 50))],
  Q: [arc(50, 50, 30, 40, -90, -450), line(58, 68, 82, 92)],
  R: [line(25, 10, 25, 90), join(line(25, 10, 55, 10), arc(55, 30, 20, 20, -90, 90), line(55, 50, 25, 50)), line(48, 50, 75, 90)],
  S: [join(arc(50, 30, 22, 20, -30, -270), arc(50, 70, 24, 20, -90, 150))],
  T: [line(20, 10, 80, 10), line(50, 10, 50, 90)],
  U: [join(line(25, 10, 25, 65), arc(50, 65, 25, 25, 180, 0), line(75, 65, 75, 10))],
  V: [line(20, 10, 50, 90, 80, 10)],
  W: [line(15, 10, 32, 90, 50, 40, 68, 90, 85, 10)],
  X: [line(25, 10, 75, 90), line(75, 10, 25, 90)],
  Y: [line(25, 10, 50, 50, 50, 90), line(75, 10, 50, 50)],
  Z: [line(25, 10, 75, 10, 25, 90, 75, 90)],
};

export const lowercaseStrokes: Record<string, Stroke[]> = {
  a: [arc(48, 65, 20, 25, -20, -380), line(68, 40, 68, 90)],
  b: [line(28, 10, 28, 90), arc(50, 65, 22, 25, 180, 540)],
  c: [arc(52, 65, 22, 25, -40, -320)],
  d: [arc(50, 65, 22, 25, -20, -380), line(72, 10, 72, 90)],
  e: [join(line(30, 65, 74, 65), arc(52, 65, 22, 25, 0, -320))],
  f: [join(arc(62, 25, 15, 15, -20, -180), line(47, 25, 47, 90)), line(32, 45, 64, 45)],
  g: [arc(48, 60, 20, 20, -20, -380), join(line(68, 40, 68, 82), arc(50, 82, 18, 16, 0, 160))],
  h: [line(28, 10, 28, 90), join(arc(50, 62, 22, 20, 180, 360), line(72, 62, 72, 90))],
  i: [line(50, 42, 50, 90), line(50, 24, 50, 28)],
  j: [join(line(55, 42, 55, 82), arc(40, 82, 15, 15, 0, 160)), line(55, 24, 55, 28)],
  k: [line(30, 10, 30, 90), line(68, 40, 30, 70), line(42, 62, 70, 90)],
  l: [line(50, 10, 50, 90)],
  m: [line(22, 42, 22, 90), join(arc(36, 58, 14, 14, 180, 360), line(50, 58, 50, 90)), join(arc(64, 58, 14, 14, 180, 360), line(78, 58, 78, 90))],
  n: [line(28, 42, 28, 90), join(arc(50, 62, 22, 20, 180, 360), line(72, 62, 72, 90))],
  o: [arc(50, 65, 22, 25, -90, -450)],
  p: [line(28, 42, 28, 98), arc(50, 62, 22, 20, 180, 540)],
  q: [arc(50, 62, 22, 20, -20, -380), line(72, 42, 72, 98)],
  r: [line(32, 42, 32, 90), arc(52, 62, 20, 20, 180, 300)],
  s: [join(arc(50, 52, 16, 12, -30, -270), arc(50, 77, 18, 13, -90, 150))],
  t: [join(line(48, 18, 48, 80), arc(60, 80, 12, 10, 180, 60)), line(32, 42, 66, 42)],
  u: [join(line(28, 42, 28, 68), arc(50, 68, 22, 22, 180, 0)), line(72, 42, 72, 90)],
  v: [line(25, 42, 50, 90, 75, 42)],
  w: [line(18, 42, 33, 90, 50, 55, 67, 90, 82, 42)],
  x: [line(28, 42, 72, 90), line(72, 42, 28, 90)],
  y: [line(28, 42, 50, 80), line(72, 42, 38, 98)],
  z: [line(28, 42, 72, 42, 28, 90, 72, 90)],
};

export function strokesFor(letter: string): Stroke[] {
  return (letter === letter.toUpperCase() ? uppercaseStrokes : lowercaseStrokes)[letter] ?? [];
}

/** SVG path data for a polyline stroke. */
export function strokePath(stroke: Stroke): string {
  return stroke.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

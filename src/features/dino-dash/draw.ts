import { DINO_X, GROUND_Y, START_LIVES, VIEW_HEIGHT, dinoBox, nextLetter, type GameState, type Obstacle, type Pickup } from './engine';
import type { DinoTheme } from './themes';
import { dinoColors, type DinoColor } from '../../../packages/learning-core/src/dino/colors';

export { dinoColors };
export type { DinoColor };

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

const letterRing = ['#E23E57', '#EE5A30', '#FFB21E', '#0F9D68', '#1F86EB', '#6C4EF5', '#E8448C'];
const FONT = 'Fredoka, Nunito, "Segoe UI", sans-serif';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Small deterministic noise so decorations stay put between frames. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, theme: DinoTheme, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, VIEW_HEIGHT);

  const sx = w - 90;
  const sy = 62;
  const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 80);
  glow.addColorStop(0, theme.sun);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(sx, sy, 28, 0, Math.PI * 2);
  ctx.fill();
  if (theme.night) {
    ctx.fillStyle = theme.skyTop;
    ctx.beginPath();
    ctx.arc(sx + 12, sy - 8, 24, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = theme.sun;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time * 0.4;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(angle) * 38, sy + Math.sin(angle) * 38);
      ctx.lineTo(sx + Math.cos(angle) * 48, sy + Math.sin(angle) * 48);
      ctx.stroke();
    }
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 14 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y - 8 * s, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 38 * s, y, 14 * s, 0, Math.PI * 2);
  ctx.fill();
  rr(ctx, x - 6 * s, y - 2 * s, 52 * s, 16 * s, 8 * s);
  ctx.fill();
}

function drawDecor(ctx: CanvasRenderingContext2D, w: number, state: GameState, theme: DinoTheme, time: number) {
  const d = state.distance;
  if (theme.decor === 'stars') {
    for (let i = 0; i < 40; i++) {
      const x = hash(i) * w;
      const y = hash(i + 50) * (GROUND_Y - 90);
      const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + i);
      ctx.globalAlpha = 0.4 + twinkle * 0.6;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, 1 + hash(i + 7) * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (theme.decor !== 'stars') {
    for (let i = 0; i < 4; i++) {
      const x = wrap(hash(i + 3) * w * 1.4 - d * 0.08 - time * 6, w + 160) - 80;
      drawCloud(ctx, x, 40 + hash(i + 9) * 60, 0.8 + hash(i) * 0.6, theme.cloud);
    }
  }
  const fall = (count: number, size: number, color: string, speed: number, rising = false) => {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const x = wrap(hash(i) * w - d * 0.2 + Math.sin(time + i) * 10, w);
      const travel = wrap(hash(i + 21) * GROUND_Y + time * speed * (0.6 + hash(i + 4)), GROUND_Y);
      const y = rising ? GROUND_Y - travel : travel;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(x, y, size * (0.6 + hash(i + 2) * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  if (theme.decor === 'snow') fall(36, 2.6, '#FFFFFF', 30);
  if (theme.decor === 'bubbles') {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const x = wrap(hash(i) * w - d * 0.1, w);
      const y = GROUND_Y - wrap(hash(i + 30) * GROUND_Y + time * 24 * (0.5 + hash(i)), GROUND_Y);
      ctx.beginPath();
      ctx.arc(x, y, 4 + hash(i + 5) * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (theme.decor === 'leaves') fall(14, 3.6, theme.nearHills, 26);
  if (theme.decor === 'embers') fall(22, 2.2, '#FFB347', 34, true);
}

function drawHills(ctx: CanvasRenderingContext2D, w: number, offset: number, base: number, height: number, color: string, freq: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= w + 8; x += 8) {
    const t = (x + offset) * freq;
    const y = base - (Math.sin(t) * 0.6 + Math.sin(t * 0.43 + 1.7) * 0.4 + 1) * height * 0.5;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, state: GameState, theme: DinoTheme) {
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, GROUND_Y, w, VIEW_HEIGHT - GROUND_Y);
  ctx.fillStyle = theme.groundEdge;
  ctx.fillRect(0, GROUND_Y, w, 6);
  ctx.fillStyle = theme.groundDots;
  const spacing = 46;
  const shift = wrap(state.distance, spacing);
  for (let x = -shift, i = Math.floor(state.distance / spacing); x < w + spacing; x += spacing, i++) {
    rr(ctx, x + hash(i) * 20, GROUND_Y + 14 + hash(i + 3) * 22, 10 + hash(i + 1) * 12, 5, 2.5);
    ctx.fill();
  }
}

function drawCactus(ctx: CanvasRenderingContext2D, x: number, bottom: number, w: number, h: number, theme: DinoTheme) {
  const trunk = Math.max(12, w * 0.5);
  const tx = x + (w - trunk) / 2;
  ctx.fillStyle = theme.cactus;
  rr(ctx, tx, bottom - h, trunk, h, trunk / 2);
  ctx.fill();
  rr(ctx, x - 2, bottom - h * 0.62, trunk * 0.62, h * 0.32, trunk * 0.31);
  ctx.fill();
  rr(ctx, x + w - trunk * 0.62 + 2, bottom - h * 0.78, trunk * 0.62, h * 0.36, trunk * 0.31);
  ctx.fill();
  ctx.fillStyle = theme.cactusDark;
  ctx.fillRect(tx + trunk / 2 - 1.5, bottom - h + 6, 3, h - 10);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  rr(ctx, tx + 3, bottom - h + 5, 4, h * 0.45, 2);
  ctx.fill();
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, theme: DinoTheme, time: number) {
  const bottom = GROUND_Y - o.lift;
  if (o.kind === 'rock') {
    ctx.fillStyle = theme.rock;
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, bottom - o.h / 2 + 2, o.w / 2, o.h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(o.x + o.w * 0.35, bottom - o.h * 0.65, o.w * 0.14, o.h * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (o.kind === 'cactus-group') {
    drawCactus(ctx, o.x, bottom, 22, o.h * 0.8, theme);
    drawCactus(ctx, o.x + 20, bottom, 24, o.h, theme);
    drawCactus(ctx, o.x + 42, bottom, 22, o.h * 0.7, theme);
    return;
  }
  if (o.kind === 'bird-low' || o.kind === 'bird-high') {
    const cx = o.x + o.w / 2;
    const cy = bottom - o.h / 2;
    const flap = Math.sin(time * 14 + o.id);
    ctx.fillStyle = theme.birdWing;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy - 22 * flap);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = theme.bird;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 16, cy - 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFB21E';
    ctx.beginPath();
    ctx.moveTo(cx - 23, cy - 4);
    ctx.lineTo(cx - 33, cy);
    ctx.lineTo(cx - 23, cy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2B2D42';
    ctx.beginPath();
    ctx.arc(cx - 18, cy - 4, 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  drawCactus(ctx, o.x, bottom, o.w, o.h, theme);
}

function drawHeartShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.4, cy, cx - s * 0.7, cy - s * 1.1, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.1, cx + s * 1.4, cy, cx, cy + s * 0.9);
  ctx.closePath();
}

function drawPickup(ctx: CanvasRenderingContext2D, p: Pickup, time: number) {
  const cy = GROUND_Y - p.lift + Math.sin(time * 3 + p.id) * 4;
  if (p.kind === 'heart') {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(p.x, cy, p.r + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E23E57';
    drawHeartShape(ctx, p.x, cy, p.r * 0.75);
    ctx.fill();
    return;
  }
  const ring = letterRing[(p.letter ?? 'A').charCodeAt(0) % letterRing.length];
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(p.x, cy, p.r + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(p.x, cy, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ring;
  ctx.font = `700 24px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.letter ?? '', p.x, cy + 1);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(p.x - p.r * 0.45, cy - p.r * 0.5, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawDino(ctx: CanvasRenderingContext2D, state: GameState, color: DinoColor, time: number) {
  const box = dinoBox(state.dino);
  const ducking = state.dino.ducking && state.dino.onGround;
  const blinking = state.status === 'running' && state.time < state.invincibleUntil && Math.floor(time * 10) % 2 === 0;
  const eyeClosed = wrap(time, 3.6) < 0.12;
  ctx.save();
  ctx.translate(DINO_X, GROUND_Y - box.bottom);
  ctx.globalAlpha = blinking ? 0.35 : 1;

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(box.w / 2, box.bottom + 3, box.w / 2 - Math.min(10, box.bottom / 8), 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const stride = state.dino.onGround ? Math.sin(state.distance / 12) : 0;
  const legY = (side: number) => (state.dino.onGround ? Math.max(0, stride * side) * 5 : 3);

  if (ducking) {
    ctx.fillStyle = color.body;
    ctx.beginPath();
    ctx.moveTo(6, -18);
    ctx.lineTo(-12, -10);
    ctx.lineTo(8, -8);
    ctx.fill();
    ctx.fillStyle = color.spikes;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(10 + i * 9, -25);
      ctx.lineTo(14 + i * 9, -33);
      ctx.lineTo(18 + i * 9, -25);
      ctx.fill();
    }
    ctx.fillStyle = color.dark;
    rr(ctx, 14, -10 - legY(1), 8, 10, 3); ctx.fill();
    rr(ctx, 32, -10 - legY(-1), 8, 10, 3); ctx.fill();
    ctx.fillStyle = color.body;
    rr(ctx, 4, -28, 48, 22, 11); ctx.fill();
    rr(ctx, 40, -34, 30, 22, 10); ctx.fill();
    ctx.fillStyle = color.belly;
    rr(ctx, 14, -16, 26, 9, 4.5); ctx.fill();
    drawFace(ctx, 60, -26, eyeClosed);
  } else {
    ctx.fillStyle = color.body;
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.lineTo(-12, -20);
    ctx.lineTo(12, -16);
    ctx.fill();
    ctx.fillStyle = color.spikes;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(8 + i * 8, -38 + i * 2);
      ctx.lineTo(12 + i * 8, -48 + i * 2);
      ctx.lineTo(16 + i * 8, -38 + i * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(30, -56);
    ctx.lineTo(35, -64);
    ctx.lineTo(40, -56);
    ctx.fill();
    ctx.fillStyle = color.dark;
    rr(ctx, 13, -14 - legY(1), 9, 14, 4); ctx.fill();
    rr(ctx, 27, -14 - legY(-1), 9, 14, 4); ctx.fill();
    ctx.fillStyle = color.body;
    rr(ctx, 6, -42, 34, 32, 15); ctx.fill();
    rr(ctx, 24, -60, 32, 26, 11); ctx.fill();
    ctx.fillStyle = color.belly;
    ctx.beginPath();
    ctx.ellipse(23, -24, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color.dark;
    rr(ctx, 37, -32, 9, 5, 2.5); ctx.fill();
    drawFace(ctx, 45, -50, eyeClosed);
  }
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, eyeClosed: boolean) {
  if (eyeClosed) {
    ctx.strokeStyle = '#2B2D42';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2B2D42';
    ctx.beginPath();
    ctx.arc(x + 1.2, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + 2.2, y - 1.4, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,120,160,0.55)';
  ctx.beginPath();
  ctx.arc(x - 4, y + 8, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2B2D42';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x + 4, y + 7, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  rr(ctx, x, y, w, 30, 15);
  ctx.fill();
}

function drawHud(ctx: CanvasRenderingContext2D, w: number, state: GameState, theme: DinoTheme) {
  ctx.textBaseline = 'middle';
  pill(ctx, 10, 10, 98);
  for (let i = 0; i < START_LIVES; i++) {
    ctx.fillStyle = i < state.lives ? '#E23E57' : 'rgba(43,45,66,0.18)';
    drawHeartShape(ctx, 30 + i * 28, 25, 9);
    ctx.fill();
  }

  const scoreText = String(state.score).padStart(5, '0');
  ctx.font = `700 18px ${FONT}`;
  const scoreW = ctx.measureText(scoreText).width + 26;
  pill(ctx, w - scoreW - 10, 10, scoreW);
  ctx.fillStyle = '#2B2D42';
  ctx.textAlign = 'center';
  ctx.fillText(scoreText, w - scoreW / 2 - 10, 26);

  const levelText = `Level ${state.level} · ${theme.name}`;
  ctx.font = `600 15px ${FONT}`;
  const levelW = ctx.measureText(levelText).width + 26;
  const levelX = Math.max(116, (w - levelW) / 2);
  if (levelX + levelW < w - scoreW - 16) {
    pill(ctx, levelX, 10, levelW);
    ctx.fillStyle = '#4B2FCB';
    ctx.fillText(levelText, levelX + levelW / 2, 26);
  }

  const next = `Next letter: ${nextLetter(state.lettersCollected)}`;
  ctx.font = `600 14px ${FONT}`;
  const nextW = ctx.measureText(next).width + 24;
  pill(ctx, 10, 46, nextW);
  ctx.fillStyle = '#0A6E49';
  ctx.textAlign = 'left';
  ctx.fillText(next, 22, 62);
}

export interface DrawOptions {
  theme: DinoTheme;
  color: DinoColor;
  /** Wall-clock seconds, so idle screens still animate. */
  time: number;
  particles: Particle[];
  showHud: boolean;
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState, options: DrawOptions) {
  const { theme, color, time, particles } = options;
  const w = state.viewWidth;
  drawSky(ctx, w, theme, time);
  drawDecor(ctx, w, state, theme, time);
  drawHills(ctx, w, state.distance * 0.12, GROUND_Y - 40, 70, theme.farHills, 0.012);
  drawHills(ctx, w, state.distance * 0.3 + 400, GROUND_Y - 6, 46, theme.nearHills, 0.02);
  drawGround(ctx, w, state, theme);
  for (const pickup of state.pickups) drawPickup(ctx, pickup, time);
  for (const obstacle of state.obstacles) drawObstacle(ctx, obstacle, theme, time);
  drawDino(ctx, state, color, time);
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (options.showHud) drawHud(ctx, w, state, theme);
}

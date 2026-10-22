// Dino Dash rules: an endless runner with gentle, ever-rising levels.
// Coordinates are logical pixels: the view is VIEW_HEIGHT tall and `viewWidth` wide.
// `lift` values are heights above the ground line, so bigger means higher.

export const VIEW_HEIGHT = 300;
export const GROUND_Y = 252;
export const DINO_X = 64;
export const START_LIVES = 3;

const DINO_SIZE = { w: 54, h: 58, duckW: 70, duckH: 36 };
const GRAVITY = 2700;
const JUMP_VELOCITY = 930;
const SHORT_HOP_VELOCITY = 430;
const INVINCIBLE_SECONDS = 1.6;
const LETTER_BONUS = 25;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export type ObstacleKind = 'cactus-small' | 'cactus-tall' | 'cactus-group' | 'rock' | 'bird-low' | 'bird-high';

export const OBSTACLE_SIZES: Record<ObstacleKind, { w: number; h: number; lift: number }> = {
  'cactus-small': { w: 26, h: 44, lift: 0 },
  'cactus-tall': { w: 30, h: 66, lift: 0 },
  'cactus-group': { w: 64, h: 48, lift: 0 },
  rock: { w: 46, h: 28, lift: 0 },
  // Jump over this one.
  'bird-low': { w: 50, h: 32, lift: 16 },
  // Duck under this one (a ducking dino is 36 tall).
  'bird-high': { w: 50, h: 30, lift: 40 },
};

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  w: number;
  h: number;
  lift: number;
}

export interface Pickup {
  id: number;
  kind: 'letter' | 'heart';
  letter?: string;
  x: number;
  /** Height of the pickup's centre above the ground. */
  lift: number;
  r: number;
}

export interface Dino {
  lift: number;
  velocity: number;
  onGround: boolean;
  ducking: boolean;
}

export type GameStatus = 'ready' | 'running' | 'paused' | 'over';

export interface GameState {
  status: GameStatus;
  viewWidth: number;
  time: number;
  distance: number;
  bonus: number;
  score: number;
  level: number;
  levelStartScore: number;
  speed: number;
  lives: number;
  invincibleUntil: number;
  dino: Dino;
  obstacles: Obstacle[];
  pickups: Pickup[];
  obstacleTimer: number;
  pickupTimer: number;
  heartPending: boolean;
  lettersCollected: number;
  nextId: number;
}

export interface GameInput {
  jumpHeld: boolean;
  /** True only on the frame the jump button went down. */
  jumpPressed: boolean;
  duckHeld: boolean;
}

export type GameEvent =
  | { type: 'jump' }
  | { type: 'hit'; livesLeft: number }
  | { type: 'gameOver' }
  | { type: 'levelUp'; level: number }
  | { type: 'letter'; letter: string }
  | { type: 'heart'; lives: number };

/** Speed rises every level but levels off near 660 px/s so it never becomes unplayable. */
export function speedForLevel(level: number): number {
  return 320 + 340 * (1 - Math.exp(-(level - 1) / 7));
}

/** Points needed to finish a level. Later levels are a little longer, up to a cap. */
export function pointsForLevel(level: number): number {
  return Math.min(380 + 60 * (level - 1), 1000);
}

/** Seconds of warning before the next obstacle. Shrinks with level but keeps a safe floor. */
export function reactionSeconds(level: number): number {
  return Math.max(0.6, 1 - 0.04 * (level - 1));
}

export function obstacleKindsForLevel(level: number): ObstacleKind[] {
  const kinds: ObstacleKind[] = ['cactus-small', 'rock'];
  if (level >= 2) kinds.push('cactus-tall');
  if (level >= 3) kinds.push('cactus-group');
  if (level >= 4) kinds.push('bird-low');
  if (level >= 5) kinds.push('bird-high');
  return kinds;
}

export function nextLetter(collected: number): string {
  return LETTERS[collected % LETTERS.length];
}

export function createGame(viewWidth: number): GameState {
  return {
    status: 'ready',
    viewWidth,
    time: 0,
    distance: 0,
    bonus: 0,
    score: 0,
    level: 1,
    levelStartScore: 0,
    speed: speedForLevel(1),
    lives: START_LIVES,
    invincibleUntil: 0,
    dino: { lift: 0, velocity: 0, onGround: true, ducking: false },
    obstacles: [],
    pickups: [],
    obstacleTimer: viewWidth * 0.6,
    pickupTimer: viewWidth * 0.9,
    heartPending: false,
    lettersCollected: 0,
    nextId: 1,
  };
}

export function dinoBox(dino: Dino): { x: number; w: number; bottom: number; h: number } {
  const ducking = dino.ducking && dino.onGround;
  return {
    x: DINO_X,
    w: ducking ? DINO_SIZE.duckW : DINO_SIZE.w,
    h: ducking ? DINO_SIZE.duckH : DINO_SIZE.h,
    bottom: dino.lift,
  };
}

function overlaps(
  a: { x: number; w: number; bottom: number; h: number },
  b: { x: number; w: number; bottom: number; h: number },
  inset: number,
): boolean {
  return (
    a.x + inset < b.x + b.w - inset &&
    a.x + a.w - inset > b.x + inset &&
    a.bottom + inset < b.bottom + b.h - inset &&
    a.bottom + a.h - inset > b.bottom + inset
  );
}

function spawnObstacle(state: GameState, random: () => number): Obstacle {
  const kinds = obstacleKindsForLevel(state.level);
  const kind = kinds[Math.min(kinds.length - 1, Math.floor(random() * kinds.length))];
  const size = OBSTACLE_SIZES[kind];
  const obstacle: Obstacle = { id: state.nextId++, kind, x: state.viewWidth + 20, ...size };
  state.obstacles.push(obstacle);
  return obstacle;
}

function spawnPickup(state: GameState, random: () => number): void {
  const x = state.viewWidth + 20;
  const blocked = state.obstacles.some((o) => o.x + o.w > x - 90 && o.x < x + 90);
  if (blocked || state.pickups.some((p) => p.kind === 'letter')) {
    state.pickupTimer = 140;
    return;
  }
  const high = random() < 0.5;
  if (state.heartPending) {
    state.heartPending = false;
    state.pickups.push({ id: state.nextId++, kind: 'heart', x, lift: high ? 120 : 34, r: 18 });
  } else {
    state.pickups.push({ id: state.nextId++, kind: 'letter', letter: nextLetter(state.lettersCollected), x, lift: high ? 120 : 34, r: 20 });
  }
  state.pickupTimer = state.speed * (2.2 + random() * 1.8);
}

export function startGame(state: GameState): void {
  if (state.status === 'ready' || state.status === 'paused') state.status = 'running';
}

export function step(state: GameState, dt: number, input: GameInput, random: () => number = Math.random): GameEvent[] {
  const events: GameEvent[] = [];
  if (state.status !== 'running') return events;

  state.time += dt;
  const dino = state.dino;

  if (input.jumpPressed && dino.onGround) {
    dino.velocity = JUMP_VELOCITY;
    dino.onGround = false;
    dino.ducking = false;
    events.push({ type: 'jump' });
  }
  // A quick tap still clears every cactus: the jump is only shortened after a 50px rise.
  if (!input.jumpHeld && dino.lift > 50 && dino.velocity > SHORT_HOP_VELOCITY) dino.velocity = SHORT_HOP_VELOCITY;
  dino.ducking = input.duckHeld && dino.onGround;

  if (!dino.onGround) {
    const fastFall = input.duckHeld ? 2 : 1;
    dino.velocity -= GRAVITY * fastFall * dt;
    dino.lift += dino.velocity * dt;
    if (dino.lift <= 0) {
      dino.lift = 0;
      dino.velocity = 0;
      dino.onGround = true;
      dino.ducking = input.duckHeld;
    }
  }

  const dx = state.speed * dt;
  state.distance += dx;
  for (const obstacle of state.obstacles) obstacle.x -= dx;
  for (const pickup of state.pickups) pickup.x -= dx;
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > -40);
  state.pickups = state.pickups.filter((p) => p.x + p.r > -40);

  state.obstacleTimer -= dx;
  if (state.obstacleTimer <= 0) {
    const spawned = spawnObstacle(state, random);
    state.obstacleTimer = state.speed * reactionSeconds(state.level) + random() * state.speed * 0.9 + spawned.w + 60;
  }
  state.pickupTimer -= dx;
  if (state.pickupTimer <= 0) spawnPickup(state, random);

  const body = dinoBox(dino);
  if (state.time >= state.invincibleUntil) {
    const hit = state.obstacles.find((o) => overlaps(body, { x: o.x, w: o.w, h: o.h, bottom: o.lift }, 7));
    if (hit) {
      state.lives -= 1;
      state.invincibleUntil = state.time + INVINCIBLE_SECONDS;
      events.push({ type: 'hit', livesLeft: state.lives });
      if (state.lives <= 0) {
        state.status = 'over';
        events.push({ type: 'gameOver' });
        return events;
      }
    }
  }

  state.pickups = state.pickups.filter((pickup) => {
    const box = { x: pickup.x - pickup.r, w: pickup.r * 2, bottom: pickup.lift - pickup.r, h: pickup.r * 2 };
    if (!overlaps(body, box, 0)) return true;
    if (pickup.kind === 'heart') {
      state.lives = Math.min(START_LIVES, state.lives + 1);
      events.push({ type: 'heart', lives: state.lives });
    } else if (pickup.letter) {
      state.lettersCollected += 1;
      state.bonus += LETTER_BONUS;
      events.push({ type: 'letter', letter: pickup.letter });
    }
    return false;
  });

  state.score = Math.floor(state.distance / 10) + state.bonus;
  if (state.score - state.levelStartScore >= pointsForLevel(state.level)) {
    state.level += 1;
    state.levelStartScore = state.score;
    state.speed = speedForLevel(state.level);
    if (state.lives < START_LIVES && state.level % 2 === 1) state.heartPending = true;
    events.push({ type: 'levelUp', level: state.level });
  }

  return events;
}

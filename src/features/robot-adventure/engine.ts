import type { GameDifficulty } from '../learning-games/difficulty';

export type Direction = 'up' | 'right' | 'down' | 'left';
export type Command = 'forward' | 'left' | 'right';

export interface Cell {
  x: number;
  y: number;
}

export interface RobotState extends Cell {
  dir: Direction;
}

export interface RobotLevel {
  id: string;
  title: string;
  difficulty: GameDifficulty;
  width: number;
  height: number;
  start: RobotState;
  goal: Cell;
  rocks: Cell[];
  star?: Cell;
  /** Most commands allowed, for the harder levels. */
  maxCommands?: number;
  /** One working program, used by tests and the hint button. */
  solution: Command[];
  tip: string;
}

const F: Command = 'forward';
const L: Command = 'left';
const R: Command = 'right';

/** x grows to the right, y grows downward. Turns are the robot's own left and right. */
export const robotLevels: RobotLevel[] = [
  { id: 'straight', title: 'Straight to the flag', difficulty: 'beginner', width: 4, height: 3, start: { x: 0, y: 1, dir: 'right' }, goal: { x: 3, y: 1 }, rocks: [], solution: [F, F, F], tip: 'The robot looks to the right. How many steps to the flag?' },
  { id: 'corner', title: 'Turn the corner', difficulty: 'beginner', width: 3, height: 3, start: { x: 0, y: 2, dir: 'up' }, goal: { x: 2, y: 0 }, rocks: [], solution: [F, F, R, F, F], tip: 'Go up, then turn right.' },
  { id: 'downhill', title: 'Which way is left?', difficulty: 'beginner', width: 4, height: 3, start: { x: 0, y: 0, dir: 'down' }, goal: { x: 3, y: 2 }, rocks: [], solution: [F, F, L, F, F, F], tip: 'When the robot faces down, its left is your right!' },
  { id: 'rock', title: 'Around the rock', difficulty: 'intermediate', width: 4, height: 3, start: { x: 0, y: 1, dir: 'right' }, goal: { x: 3, y: 1 }, rocks: [{ x: 2, y: 1 }], solution: [F, L, F, R, F, F, R, F], tip: 'Go up and over the rock.' },
  { id: 'zigzag', title: 'Zig-zag path', difficulty: 'intermediate', width: 5, height: 4, start: { x: 0, y: 0, dir: 'down' }, goal: { x: 4, y: 0 }, rocks: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }], solution: [F, F, L, F, F, L, F, F, R, F, F], tip: 'Go down first, then find a way between the rocks.' },
  { id: 'rocky-road', title: 'Rocky road', difficulty: 'intermediate', width: 5, height: 3, start: { x: 0, y: 2, dir: 'right' }, goal: { x: 4, y: 2 }, rocks: [{ x: 2, y: 2 }, { x: 2, y: 1 }], solution: [F, L, F, F, R, F, F, R, F, F, L, F], tip: 'The rocks are tall. Climb to the top row to pass them.' },
  { id: 'star-snack', title: 'Star snack', difficulty: 'advanced', width: 4, height: 4, start: { x: 0, y: 3, dir: 'up' }, goal: { x: 3, y: 0 }, rocks: [{ x: 1, y: 1 }, { x: 2, y: 2 }], star: { x: 0, y: 0 }, maxCommands: 8, solution: [F, F, F, R, F, F, F], tip: 'Pick up the star before the flag. Use 8 commands or fewer.' },
  { id: 'star-detour', title: 'Star detour', difficulty: 'advanced', width: 5, height: 4, start: { x: 0, y: 0, dir: 'right' }, goal: { x: 4, y: 0 }, rocks: [{ x: 2, y: 0 }, { x: 2, y: 1 }], star: { x: 2, y: 3 }, maxCommands: 14, solution: [R, F, F, F, L, F, F, F, F, L, F, F, F], tip: 'The star is at the bottom. Use 14 commands or fewer.' },
  { id: 'long-trip', title: 'Long trip', difficulty: 'advanced', width: 5, height: 5, start: { x: 0, y: 4, dir: 'up' }, goal: { x: 4, y: 0 }, rocks: [{ x: 1, y: 3 }, { x: 2, y: 1 }, { x: 3, y: 3 }], star: { x: 4, y: 4 }, maxCommands: 10, solution: [R, F, F, F, F, L, F, F, F, F], tip: 'Get the star in the corner, then go up. Only 10 commands!' },
];

const order: Direction[] = ['up', 'right', 'down', 'left'];
const delta: Record<Direction, Cell> = { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } };

export function turn(dir: Direction, command: 'left' | 'right'): Direction {
  const index = order.indexOf(dir);
  return order[(index + (command === 'right' ? 1 : 3)) % 4];
}

export function sameCell(a: Cell, b: Cell | undefined): boolean {
  return Boolean(b) && a.x === b!.x && a.y === b!.y;
}

export type RunOutcome = 'goal' | 'rock' | 'edge' | 'need-star' | 'not-there' | 'too-long' | 'empty';

export interface RunStep {
  robot: RobotState;
  star: boolean;
  /** Index of the command that produced this step. */
  command: number;
}

export interface RunResult {
  outcome: RunOutcome;
  /** Robot positions after each command that ran, in order. */
  steps: RunStep[];
  /** Command that bumped, when the outcome is "rock" or "edge". */
  failedAt?: number;
}

/**
 * Runs a program to the end without any timing. The UI replays `steps` slowly,
 * but the result never depends on animation. The robot stops early, happy,
 * when it reaches the flag with every star.
 */
export function runProgram(level: RobotLevel, program: Command[]): RunResult {
  if (program.length === 0) return { outcome: 'empty', steps: [] };
  if (level.maxCommands !== undefined && program.length > level.maxCommands) return { outcome: 'too-long', steps: [] };
  let robot: RobotState = { ...level.start };
  let star = !level.star;
  const steps: RunStep[] = [];
  for (let i = 0; i < program.length; i++) {
    const command = program[i];
    if (command === 'forward') {
      const next = { x: robot.x + delta[robot.dir].x, y: robot.y + delta[robot.dir].y };
      if (next.x < 0 || next.y < 0 || next.x >= level.width || next.y >= level.height) return { outcome: 'edge', steps, failedAt: i };
      if (level.rocks.some((rock) => sameCell(next, rock))) return { outcome: 'rock', steps, failedAt: i };
      robot = { ...robot, ...next };
      if (sameCell(robot, level.star)) star = true;
    } else {
      robot = { ...robot, dir: turn(robot.dir, command) };
    }
    steps.push({ robot, star, command: i });
    if (sameCell(robot, level.goal) && star) return { outcome: 'goal', steps };
  }
  return { outcome: sameCell(robot, level.goal) ? 'need-star' : 'not-there', steps };
}

export function outcomeMessage(outcome: RunOutcome, failedAt?: number): string {
  const which = failedAt !== undefined ? ` Look at command ${failedAt + 1}.` : '';
  switch (outcome) {
    case 'goal': return 'Hooray! The robot made it to the flag!';
    case 'rock': return `Bump! A rock is in the way.${which}`;
    case 'edge': return `Oops! That would go off the board.${which}`;
    case 'need-star': return 'The robot reached the flag, but forgot the star. Try a path through the star!';
    case 'not-there': return 'The robot stopped before the flag. Add more commands!';
    case 'too-long': return 'That is too many commands for this level. Can you find a shorter way?';
    default: return 'Add some commands first, then press Go!';
  }
}

export function levelsFor(difficulty: GameDifficulty): RobotLevel[] {
  return robotLevels.filter((level) => level.difficulty === difficulty);
}

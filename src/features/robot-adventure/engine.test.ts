import { describe, expect, it } from 'vitest';
import { commandLimit, hintFor, levelsFor, robotLevels, runProgram, shortestFinish, turn, type Command, type RobotLevel } from './engine';

const level = (id: string): RobotLevel => robotLevels.find((item) => item.id === id)!;

describe('Robot turns', () => {
  it('turns relative to where the robot faces', () => {
    expect(turn('up', 'right')).toBe('right');
    expect(turn('up', 'left')).toBe('left');
    expect(turn('down', 'left')).toBe('right');
    expect(turn('left', 'right')).toBe('up');
  });
});

describe('Robot levels', () => {
  it('has three levels for each difficulty with unique ids', () => {
    expect(levelsFor('beginner')).toHaveLength(3);
    expect(levelsFor('intermediate')).toHaveLength(3);
    expect(levelsFor('advanced')).toHaveLength(3);
    expect(new Set(robotLevels.map((item) => item.id)).size).toBe(robotLevels.length);
  });

  it('is solvable with each stored solution, within any command limit', () => {
    for (const item of robotLevels) {
      expect(runProgram(item, item.solution).outcome, item.id).toBe('goal');
      if (item.maxCommands) expect(item.solution.length, item.id).toBeLessThanOrEqual(item.maxCommands);
    }
  });

  it('keeps every cell on the board and the start clear', () => {
    for (const item of robotLevels) {
      for (const cell of [item.start, item.goal, ...item.rocks, ...(item.star ? [item.star] : [])]) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.x).toBeLessThan(item.width);
        expect(cell.y).toBeLessThan(item.height);
      }
      expect(item.rocks.some((rock) => rock.x === item.start.x && rock.y === item.start.y)).toBe(false);
      expect(item.rocks.some((rock) => rock.x === item.goal.x && rock.y === item.goal.y)).toBe(false);
    }
  });
});

describe('Running a program', () => {
  it('stops at a rock and names the command', () => {
    const result = runProgram(level('rock'), ['forward', 'forward']);
    expect(result.outcome).toBe('rock');
    expect(result.failedAt).toBe(1);
    expect(result.steps).toHaveLength(1);
  });

  it('stops at the edge of the board', () => {
    const result = runProgram(level('straight'), ['left', 'forward', 'forward']);
    expect(result.outcome).toBe('edge');
    expect(result.failedAt).toBe(2);
  });

  it('says when the program ends early', () => {
    expect(runProgram(level('straight'), ['forward']).outcome).toBe('not-there');
    expect(runProgram(level('straight'), []).outcome).toBe('empty');
  });

  it('needs the star before the flag counts', () => {
    const noStar = runProgram(level('star-snack'), ['right', 'forward', 'forward', 'forward', 'left', 'forward', 'forward', 'forward']);
    expect(noStar.outcome).toBe('need-star');
    const detour = level('long-trip');
    expect(runProgram(detour, ['forward', 'forward', 'forward', 'forward', 'right', 'forward', 'forward', 'forward', 'forward']).outcome).not.toBe('goal');
  });

  it('refuses programs longer than the limit', () => {
    const item = level('long-trip');
    const tooLong = [...item.solution, 'left' as const];
    expect(runProgram(item, tooLong).outcome).toBe('too-long');
  });

  it('is deterministic', () => {
    const item = level('zigzag');
    expect(runProgram(item, item.solution)).toEqual(runProgram(item, item.solution));
  });
});

describe('Robot hints', () => {
  /** Follows hints from `start` until the plan works, applying each suggested change. */
  const followHints = (item: RobotLevel, start: Command[]) => {
    let program = [...start];
    for (let i = 0; i < 40; i++) {
      const hint = hintFor(item, program);
      if (hint.kind === 'ready') return program;
      program = hint.kind === 'next' ? [...program, hint.command] : [...program.slice(0, hint.index), hint.command];
    }
    throw new Error(`${item.id}: hints did not converge`);
  };

  it('lead from an empty plan to a working one on every level, within the limit', () => {
    for (const item of robotLevels) {
      const program = followHints(item, []);
      expect(runProgram(item, program).outcome, item.id).toBe('goal');
      expect(program.length, item.id).toBeLessThanOrEqual(commandLimit(item));
    }
  });

  it('never crash on a correct plan with extra steps (the old Hint crash)', () => {
    const straight = robotLevels.find((item) => item.id === 'straight')!;
    expect(hintFor(straight, ['forward', 'forward', 'forward', 'forward'])).toEqual({ kind: 'ready' });
    expect(hintFor(straight, ['forward', 'forward', 'forward', 'left', 'left'])).toEqual({ kind: 'ready' });
  });

  it('accept a different working path instead of steering to the stored solution', () => {
    const rock = robotLevels.find((item) => item.id === 'rock')!;
    // Under the rock instead of over it.
    const below: Command[] = ['forward', 'right', 'forward', 'left', 'forward', 'forward', 'left', 'forward'];
    expect(runProgram(rock, below).outcome).toBe('goal');
    expect(hintFor(rock, below)).toEqual({ kind: 'ready' });
    expect(hintFor(rock, below.slice(0, 3))).toEqual({ kind: 'next', command: 'left' });
  });

  it('point at the first command that cannot lead anywhere, such as a bump', () => {
    const rock = robotLevels.find((item) => item.id === 'rock')!;
    expect(hintFor(rock, ['forward', 'forward', 'forward'])).toEqual({ kind: 'change', index: 1, command: 'left' });
    const corner = robotLevels.find((item) => item.id === 'corner')!;
    // A wrong turn that can be undone is not an error: turning back is a fine next step.
    expect(hintFor(corner, ['left'])).toEqual({ kind: 'next', command: 'right' });
    expect(hintFor(corner, ['left', 'forward'])).toEqual({ kind: 'change', index: 1, command: 'right' });
  });

  it('respect the command limit on star levels', () => {
    const snack = robotLevels.find((item) => item.id === 'star-snack')!;
    expect(shortestFinish(snack, [], commandLimit(snack))).toHaveLength(7);
    expect(shortestFinish(snack, [], 6)).toBeUndefined();
    // The shortest way needs 7 of the 8 commands, so even one wasted turn cannot be made up.
    expect(hintFor(snack, ['left'])).toEqual({ kind: 'change', index: 0, command: 'forward' });
    expect(hintFor(snack, ['forward', 'forward', 'left'])).toEqual({ kind: 'change', index: 2, command: 'forward' });
  });

  it('recover from any random plan on every level', () => {
    let seed = 7;
    const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const commands: Command[] = ['forward', 'left', 'right'];
    for (const item of robotLevels) {
      for (let trial = 0; trial < 25; trial++) {
        const start = Array.from({ length: Math.floor(random() * commandLimit(item)) }, () => commands[Math.floor(random() * 3)]);
        const program = followHints(item, start);
        expect(runProgram(item, program).outcome, `${item.id} from ${start.join(',')}`).toBe('goal');
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { levelsFor, robotLevels, runProgram, turn, type RobotLevel } from './engine';

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

import { describe, expect, it } from 'vitest';
import { illustrationFor } from '../../data/illustrations';
import { mulberry32 } from '../learning-games/questions';
import { createPuzzle, gridFor, isSolved, piecePosition, placePiece, puzzlePictures, undoPiece, type PuzzleSize } from './engine';

const picture = puzzlePictures.animals[0];

describe('Puzzle Planet pictures', () => {
  it('uses only bundled pictures', () => {
    for (const pictures of Object.values(puzzlePictures)) {
      for (const item of pictures) expect(illustrationFor(item.emoji), item.name).toBeTruthy();
    }
  });
});

describe('Puzzle Planet board', () => {
  it('makes one piece per slot, never already solved', () => {
    for (const size of [4, 6, 12] as PuzzleSize[]) {
      for (let seed = 1; seed <= 20; seed += 1) {
        const state = createPuzzle(picture, size, mulberry32(seed));
        expect(state.tray.slice().sort((a, b) => a - b)).toEqual(Array.from({ length: size }, (_, i) => i));
        expect(state.cols * state.rows).toBe(size);
        expect(state.tray.every((id, i) => id === i)).toBe(false);
      }
    }
  });

  it('places a piece only in its own slot, then locks it', () => {
    let state = createPuzzle(picture, 4, mulberry32(3));
    const wrong = placePiece(state, 0, 1);
    expect(wrong.result).toBe('wrong');
    expect(wrong.state.mistakes).toBe(1);
    state = placePiece(wrong.state, 0, 0).state;
    expect(state.placed[0]).toBe(0);
    expect(state.tray).not.toContain(0);
    expect(placePiece(state, 0, 0).result).toBe('not-in-tray');
    expect(placePiece(state, 1, 0).result).toBe('slot-full');
  });

  it('solves when every piece is home, and undo takes the last one back', () => {
    let state = createPuzzle(picture, 6, mulberry32(5));
    for (let id = 0; id < 6; id += 1) state = placePiece(state, id, id).state;
    expect(isSolved(state)).toBe(true);
    state = undoPiece(state);
    expect(isSolved(state)).toBe(false);
    expect(state.tray).toEqual([5]);
    expect(undoPiece(createPuzzle(picture, 4))).toEqual(expect.objectContaining({ history: [] }));
  });

  it('shows each piece its own part of the picture', () => {
    const { cols, rows } = gridFor[12];
    expect(piecePosition(0, cols, rows)).toEqual({ x: 0, y: 0 });
    expect(piecePosition(11, cols, rows)).toEqual({ x: 100, y: 100 });
    expect(piecePosition(5, cols, rows).x).toBeCloseTo(33.33, 1);
    expect(piecePosition(5, cols, rows).y).toBe(50);
  });
});

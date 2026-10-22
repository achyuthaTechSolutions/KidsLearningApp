import type { GameDifficulty } from '../learning-games/difficulty';
import { shuffle, type Random } from '../learning-games/random';

export type PuzzleTheme = 'animals' | 'space' | 'fruits' | 'vehicles' | 'nature';
export type PuzzleSize = 4 | 6 | 12;

export interface PuzzlePicture {
  id: string;
  name: string;
  emoji: string;
}

export const puzzlePictures: Record<PuzzleTheme, PuzzlePicture[]> = {
  animals: [
    { id: 'lion', name: 'Lion', emoji: '🦁' },
    { id: 'elephant', name: 'Elephant', emoji: '🐘' },
    { id: 'panda', name: 'Panda', emoji: '🐼' },
    { id: 'giraffe', name: 'Giraffe', emoji: '🦒' },
  ],
  space: [
    { id: 'rocket', name: 'Rocket', emoji: '🚀' },
    { id: 'saturn', name: 'Ringed planet', emoji: '🪐' },
    { id: 'earth', name: 'Earth', emoji: '🌍' },
    { id: 'moon', name: 'Moon', emoji: '🌙' },
  ],
  fruits: [
    { id: 'watermelon', name: 'Watermelon', emoji: '🍉' },
    { id: 'strawberry', name: 'Strawberry', emoji: '🍓' },
    { id: 'grapes', name: 'Grapes', emoji: '🍇' },
    { id: 'banana', name: 'Banana', emoji: '🍌' },
  ],
  vehicles: [
    { id: 'train', name: 'Train', emoji: '🚂' },
    { id: 'fire-engine', name: 'Fire engine', emoji: '🚒' },
    { id: 'helicopter', name: 'Helicopter', emoji: '🚁' },
    { id: 'tractor', name: 'Tractor', emoji: '🚜' },
  ],
  nature: [
    { id: 'tree', name: 'Tree', emoji: '🌳' },
    { id: 'sunflower', name: 'Sunflower', emoji: '🌻' },
    { id: 'rainbow', name: 'Rainbow', emoji: '🌈' },
    { id: 'mushroom', name: 'Mushroom', emoji: '🍄' },
  ],
};

export const puzzleThemes: { value: PuzzleTheme; label: string; emoji: string }[] = [
  { value: 'animals', label: 'Animals', emoji: '🦁' },
  { value: 'space', label: 'Space', emoji: '🚀' },
  { value: 'fruits', label: 'Fruits', emoji: '🍉' },
  { value: 'vehicles', label: 'Vehicles', emoji: '🚂' },
  { value: 'nature', label: 'Nature', emoji: '🌳' },
];

export const gridFor: Record<PuzzleSize, { cols: number; rows: number }> = {
  4: { cols: 2, rows: 2 },
  6: { cols: 3, rows: 2 },
  12: { cols: 4, rows: 3 },
};

export const sizeForDifficulty: Record<GameDifficulty, PuzzleSize> = { beginner: 4, intermediate: 6, advanced: 12 };

export interface PuzzleState {
  picture: PuzzlePicture;
  size: PuzzleSize;
  cols: number;
  rows: number;
  /** Piece ids in the tray, mixed up. A piece id is also the slot it belongs in. */
  tray: number[];
  /** slot → piece. */
  placed: Record<number, number>;
  /** Placed pieces in order, for undo. */
  history: number[];
  mistakes: number;
}

export function createPuzzle(picture: PuzzlePicture, size: PuzzleSize, random: Random = Math.random): PuzzleState {
  const { cols, rows } = gridFor[size];
  const ids = Array.from({ length: size }, (_, i) => i);
  let tray = shuffle(ids, random);
  if (tray.every((id, i) => id === i)) tray = [...tray.slice(1), tray[0]];
  return { picture, size, cols, rows, tray, placed: {}, history: [], mistakes: 0 };
}

export type PlaceResult = 'placed' | 'wrong' | 'slot-full' | 'not-in-tray';

/** Pieces only fit their own slot, then lock in place. */
export function placePiece(state: PuzzleState, pieceId: number, slot: number): { state: PuzzleState; result: PlaceResult } {
  if (!state.tray.includes(pieceId)) return { state, result: 'not-in-tray' };
  if (state.placed[slot] !== undefined) return { state, result: 'slot-full' };
  if (pieceId !== slot) return { state: { ...state, mistakes: state.mistakes + 1 }, result: 'wrong' };
  return {
    state: {
      ...state,
      tray: state.tray.filter((id) => id !== pieceId),
      placed: { ...state.placed, [slot]: pieceId },
      history: [...state.history, pieceId],
    },
    result: 'placed',
  };
}

export function undoPiece(state: PuzzleState): PuzzleState {
  const last = state.history[state.history.length - 1];
  if (last === undefined) return state;
  const placed = { ...state.placed };
  delete placed[last];
  return { ...state, placed, tray: [last, ...state.tray], history: state.history.slice(0, -1) };
}

export function isSolved(state: PuzzleState): boolean {
  return state.tray.length === 0 && Object.keys(state.placed).length === state.size;
}

/** CSS background position for a piece, so each piece shows its own part of the picture. */
export function piecePosition(pieceId: number, cols: number, rows: number): { x: number; y: number } {
  const col = pieceId % cols;
  const row = Math.floor(pieceId / cols);
  return { x: cols === 1 ? 0 : (col / (cols - 1)) * 100, y: rows === 1 ? 0 : (row / (rows - 1)) * 100 };
}

export function pieceLabel(pieceId: number, cols: number): string {
  const row = Math.floor(pieceId / cols) + 1;
  const col = (pieceId % cols) + 1;
  return `row ${row}, column ${col}`;
}

export function puzzleId(picture: PuzzlePicture, size: PuzzleSize): string {
  return `${picture.id}-${size}`;
}

import type { InstrumentNote } from '../types';

export const pianoNotes: InstrumentNote[] = [
  { note: 'C4', frequency: 261.63, key: 'a', label: 'C', isBlack: false },
  { note: 'C#4', frequency: 277.18, key: 'w', label: 'C#', isBlack: true },
  { note: 'D4', frequency: 293.66, key: 's', label: 'D', isBlack: false },
  { note: 'D#4', frequency: 311.13, key: 'e', label: 'D#', isBlack: true },
  { note: 'E4', frequency: 329.63, key: 'd', label: 'E', isBlack: false },
  { note: 'F4', frequency: 349.23, key: 'f', label: 'F', isBlack: false },
  { note: 'F#4', frequency: 369.99, key: 't', label: 'F#', isBlack: true },
  { note: 'G4', frequency: 392.00, key: 'g', label: 'G', isBlack: false },
  { note: 'G#4', frequency: 415.30, key: 'y', label: 'G#', isBlack: true },
  { note: 'A4', frequency: 440.00, key: 'h', label: 'A', isBlack: false },
  { note: 'A#4', frequency: 466.16, key: 'u', label: 'A#', isBlack: true },
  { note: 'B4', frequency: 493.88, key: 'j', label: 'B', isBlack: false },
  { note: 'C5', frequency: 523.25, key: 'k', label: 'C', isBlack: false },
  { note: 'C#5', frequency: 554.37, key: 'o', label: 'C#', isBlack: true },
  { note: 'D5', frequency: 587.33, key: 'l', label: 'D', isBlack: false },
];

export const xylophoneNotes: InstrumentNote[] = [
  { note: 'C5', frequency: 523.25, key: '1', label: 'Do', isBlack: false },
  { note: 'D5', frequency: 587.33, key: '2', label: 'Re', isBlack: false },
  { note: 'E5', frequency: 659.25, key: '3', label: 'Mi', isBlack: false },
  { note: 'F5', frequency: 698.46, key: '4', label: 'Fa', isBlack: false },
  { note: 'G5', frequency: 783.99, key: '5', label: 'Sol', isBlack: false },
  { note: 'A5', frequency: 880.00, key: '6', label: 'La', isBlack: false },
  { note: 'B5', frequency: 987.77, key: '7', label: 'Ti', isBlack: false },
  { note: 'C6', frequency: 1046.50, key: '8', label: 'Do', isBlack: false },
];

export const drumSounds = [
  { name: 'Kick', key: 'z', frequency: 60, decay: 0.3, type: 'kick' as const },
  { name: 'Snare', key: 'x', frequency: 200, decay: 0.15, type: 'snare' as const },
  { name: 'Hi-Hat', key: 'c', frequency: 800, decay: 0.05, type: 'hihat' as const },
  { name: 'Tom', key: 'v', frequency: 120, decay: 0.25, type: 'tom' as const },
  { name: 'Crash', key: 'b', frequency: 500, decay: 0.4, type: 'crash' as const },
  { name: 'Clap', key: 'n', frequency: 1500, decay: 0.1, type: 'clap' as const },
];

export const guitarNotes: InstrumentNote[] = [
  { note: 'E3', frequency: 164.81, key: 'q', label: 'E' },
  { note: 'A3', frequency: 220.00, key: 'w', label: 'A' },
  { note: 'D4', frequency: 293.66, key: 'e', label: 'D' },
  { note: 'G4', frequency: 392.00, key: 'r', label: 'G' },
  { note: 'B4', frequency: 493.88, key: 't', label: 'B' },
  { note: 'E5', frequency: 659.25, key: 'y', label: 'E' },
];

export const fluteNotes: InstrumentNote[] = [
  { note: 'C5', frequency: 523.25, key: '1', label: 'Do' },
  { note: 'D5', frequency: 587.33, key: '2', label: 'Re' },
  { note: 'E5', frequency: 659.25, key: '3', label: 'Mi' },
  { note: 'F5', frequency: 698.46, key: '4', label: 'Fa' },
  { note: 'G5', frequency: 783.99, key: '5', label: 'Sol' },
  { note: 'A5', frequency: 880.00, key: '6', label: 'La' },
  { note: 'B5', frequency: 987.77, key: '7', label: 'Ti' },
  { note: 'C6', frequency: 1046.50, key: '8', label: 'Do' },
];

export const builtInMelodies = [
  {
    name: 'Twinkle Twinkle Little Star',
    notes: [
      { note: 'C4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
      { note: 'G4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
      { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
      { note: 'G4', duration: 1 },
      { note: 'F4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
      { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
      { note: 'D4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
      { note: 'C4', duration: 1 },
    ],
  },
  {
    name: 'Mary Had a Little Lamb',
    notes: [
      { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
      { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
      { note: 'E4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
      { note: 'E4', duration: 1 },
      { note: 'D4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
      { note: 'D4', duration: 1 },
      { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
      { note: 'G4', duration: 1 },
    ],
  },
  {
    name: 'Happy Birthday',
    notes: [
      { note: 'C4', duration: 0.375 }, { note: 'C4', duration: 0.125 },
      { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
      { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 1 },
      { note: 'C4', duration: 0.375 }, { note: 'C4', duration: 0.125 },
      { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
      { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 1 },
    ],
  },
];

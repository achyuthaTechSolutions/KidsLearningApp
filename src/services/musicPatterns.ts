/*
 * Background music, written as data. There are no recorded songs in the app, so the
 * music is played by small synthesised instruments (see music.ts). These patterns are
 * plain functions of the bar number, so a track loops the same way every time and can
 * be tested without audio.
 */

export type MusicTrack = 'play' | 'calm';

export interface TrackInfo {
  bpm: number;
  /** MIDI note of the key's root. */
  root: number;
  /** Chord per bar, as [semitones from root, minor?]. Loops. */
  progression: [number, boolean][];
  /** Melody notes per bar: 8 for eighth notes, 4 for quarter notes. */
  steps: number;
  /** Chance that a melody step rests. */
  rest: number;
}

export const tracks: Record<MusicTrack, TrackInfo> = {
  // Bright and bouncy for games: C major, I–V–vi–IV.
  play: { bpm: 104, root: 60, progression: [[0, false], [7, false], [9, true], [5, false]], steps: 8, rest: 0.35 },
  // Gentle for stories: F major, I–vi–IV–V, slow quarter notes.
  calm: { bpm: 72, root: 65, progression: [[0, false], [9, true], [5, false], [7, false]], steps: 4, rest: 0.45 },
};

/** Bars before the melody repeats. */
export const LOOP_BARS = 8;

const PENTATONIC = [0, 2, 4, 7, 9];

export interface MusicNote {
  /** Beat position in the bar, in quarter notes from 0. */
  at: number;
  midi: number;
  /** Length in quarter notes. */
  length: number;
  voice: 'melody' | 'bass' | 'chord';
}

/** A small, fixed pseudo-random sequence, so every loop sounds the same. */
function seeded(seed: number) {
  let value = seed * 9301 + 49297;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** The notes of one bar of a track. Melody notes are pentatonic and lean on chord tones. */
export function barNotes(track: MusicTrack, bar: number): MusicNote[] {
  const info = tracks[track];
  const loopBar = ((bar % LOOP_BARS) + LOOP_BARS) % LOOP_BARS;
  const [offset, minor] = info.progression[loopBar % info.progression.length];
  const chordRoot = info.root + offset;
  const chord = [0, minor ? 3 : 4, 7].map((interval) => chordRoot + interval);
  const notes: MusicNote[] = [
    { at: 0, midi: chordRoot - 24, length: 2, voice: 'bass' },
    { at: 2, midi: chordRoot - 24 + 7, length: 2, voice: 'bass' },
    ...chord.map((midi) => ({ at: 0, midi: midi - 12, length: 4, voice: 'chord' as const })),
  ];
  const random = seeded(loopBar + (track === 'play' ? 11 : 37));
  const stepLength = 4 / info.steps;
  for (let step = 0; step < info.steps; step++) {
    // Always play the first beat, so each bar has a clear start.
    if (step > 0 && random() < info.rest) continue;
    const useChordTone = step % 2 === 0 || random() < 0.5;
    const midi = useChordTone
      ? chord[Math.floor(random() * chord.length)] + 12
      : info.root + 12 + PENTATONIC[Math.floor(random() * PENTATONIC.length)];
    notes.push({ at: step * stepLength, midi, length: stepLength, voice: 'melody' });
  }
  return notes;
}

/**
 * Which music plays on a page, or none. Off where listening is the game (Music Studio,
 * Rhythm Hero, Sound Safari) and on grown-up and quiet pages.
 */
export function musicTrackFor(path: string): MusicTrack | null {
  if (['/music', '/games/rhythm', '/games/sound-safari'].some((quiet) => path === quiet || path.startsWith(`${quiet}/`))) return null;
  if (path.startsWith('/stories/')) return 'calm';
  const playful = ['/games', '/balloons', '/memory', '/spell', '/dino', '/daily', '/alphabet', '/numbers', '/animals', '/words', '/keyboard', '/stories'];
  return playful.some((section) => path === section || path.startsWith(`${section}/`)) ? 'play' : null;
}

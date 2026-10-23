import { getAudioContext } from './audio';
import { barNotes, midiToHz, tracks, type MusicNote, type MusicTrack } from './musicPatterns';

/*
 * Quiet background music for games and stories, played by small synthesised
 * instruments. It sits well under speech and sound effects, dips while the voice is
 * speaking, and stops when the app is hidden.
 */

/** Music level at the parent's full Volume. Kept low: it is a bed, not the show. */
const MUSIC_LEVEL = 0.16;
const DUCKED = 0.3;
const LOOKAHEAD = 0.35;

let current: MusicTrack | null = null;
let master: GainNode | null = null;
let duckGain: GainNode | null = null;
let timer: number | undefined;
let nextBarTime = 0;
let bar = 0;
let volume = 0.7;

function ensureNodes(ctx: AudioContext) {
  if (master && duckGain) return;
  master = ctx.createGain();
  duckGain = ctx.createGain();
  master.gain.value = volume * MUSIC_LEVEL;
  master.connect(duckGain);
  duckGain.connect(ctx.destination);
}

function playNote(ctx: AudioContext, note: MusicNote, start: number, beat: number) {
  if (!master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const length = note.length * beat;
  const peak = note.voice === 'melody' ? 0.5 : note.voice === 'bass' ? 0.55 : 0.12;
  osc.type = note.voice === 'melody' ? 'triangle' : 'sine';
  osc.frequency.value = midiToHz(note.midi);
  gain.gain.setValueAtTime(0, start);
  if (note.voice === 'chord') {
    gain.gain.linearRampToValueAtTime(peak, start + Math.min(0.4, length / 3));
    gain.gain.linearRampToValueAtTime(0, start + length);
  } else {
    // A soft pluck: quick start, gentle fade.
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + Math.max(0.15, length * 0.9));
  }
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

function schedule() {
  const ctx = getAudioContext();
  if (!ctx || !current) return;
  const info = tracks[current];
  const beat = 60 / info.bpm;
  if (nextBarTime < ctx.currentTime) nextBarTime = ctx.currentTime + 0.05;
  while (nextBarTime < ctx.currentTime + LOOKAHEAD) {
    for (const note of barNotes(current, bar)) playNote(ctx, note, nextBarTime + note.at * beat, beat);
    nextBarTime += 4 * beat;
    bar += 1;
  }
}

/** Starts a track, or keeps it going if it is already playing. */
export function startMusic(track: MusicTrack): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  ensureNodes(ctx);
  if (current === track && timer !== undefined) return;
  stopMusic();
  current = track;
  bar = 0;
  nextBarTime = ctx.currentTime + 0.1;
  if (master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(volume * MUSIC_LEVEL, ctx.currentTime + 1.2);
  }
  schedule();
  timer = window.setInterval(schedule, 100);
}

export function stopMusic(): void {
  window.clearInterval(timer);
  timer = undefined;
  current = null;
  const ctx = getAudioContext();
  if (ctx && master) {
    // Fade out what is already scheduled rather than cutting it off.
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  }
}

export function setMusicVolume(setting: number): void {
  volume = Number.isFinite(setting) ? Math.min(1, Math.max(0, setting)) : 0;
  const ctx = getAudioContext();
  if (ctx && master && current) master.gain.setTargetAtTime(volume * MUSIC_LEVEL, ctx.currentTime, 0.2);
}

/** Dips the music while the voice speaks, so words are always clear. */
export function duckMusic(speaking: boolean): void {
  const ctx = getAudioContext();
  if (!ctx || !duckGain) return;
  duckGain.gain.cancelScheduledValues(ctx.currentTime);
  duckGain.gain.setTargetAtTime(speaking ? DUCKED : 1, ctx.currentTime, speaking ? 0.06 : 0.35);
}

export function currentMusic(): MusicTrack | null {
  return current;
}

import { describe, expect, it } from 'vitest';
import { LOOP_BARS, barNotes, midiToHz, musicTrackFor, tracks } from './musicPatterns';

describe('Background music patterns', () => {
  it('repeat every few bars, so a track loops the same way', () => {
    for (const track of ['play', 'calm'] as const) {
      expect(barNotes(track, 3)).toEqual(barNotes(track, 3 + LOOP_BARS));
      expect(barNotes(track, 0)).toEqual(barNotes(track, LOOP_BARS * 5));
    }
  });

  it('keep every note inside its bar, with a bass line and a melody that always starts the bar', () => {
    for (const track of ['play', 'calm'] as const) {
      for (let bar = 0; bar < LOOP_BARS; bar++) {
        const notes = barNotes(track, bar);
        expect(notes.every((note) => note.at >= 0 && note.at + note.length <= 4)).toBe(true);
        expect(notes.filter((note) => note.voice === 'bass')).toHaveLength(2);
        expect(notes.some((note) => note.voice === 'melody' && note.at === 0)).toBe(true);
      }
    }
  });

  it('stay in the key: melody notes are in the major scale of the track', () => {
    const major = [0, 2, 4, 5, 7, 9, 11];
    for (const track of ['play', 'calm'] as const) {
      for (let bar = 0; bar < LOOP_BARS; bar++) {
        for (const note of barNotes(track, bar).filter((item) => item.voice === 'melody')) {
          expect(major).toContain((((note.midi - tracks[track].root) % 12) + 12) % 12);
        }
      }
    }
  });

  it('are slower and sparser for stories than for games', () => {
    expect(tracks.calm.bpm).toBeLessThan(tracks.play.bpm);
    expect(tracks.calm.steps).toBeLessThan(tracks.play.steps);
    expect(midiToHz(69)).toBe(440);
  });
});

describe('Music by page', () => {
  it('plays in games and activities, calm music in a story, and none where listening matters', () => {
    expect(musicTrackFor('/games')).toBe('play');
    expect(musicTrackFor('/games/racer')).toBe('play');
    expect(musicTrackFor('/balloons')).toBe('play');
    expect(musicTrackFor('/alphabet')).toBe('play');
    expect(musicTrackFor('/stories')).toBe('play');
    expect(musicTrackFor('/stories/thirsty-crow')).toBe('calm');
    for (const quiet of ['/music', '/games/rhythm', '/games/sound-safari', '/settings', '/privacy', '/', '/achievements']) expect(musicTrackFor(quiet), quiet).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { illustrationFor } from '../../data/illustrations';
import { animalData } from '../../data/animals';
import { mulberry32 } from '../learning-games/questions';
import { createPhrasePlayer, createSafariQuestion, safariChoices, safariSounds, soundsFor, type AudioOutput } from './sounds';

function fakeOutput() {
  const calls: string[] = [];
  const out: AudioOutput = {
    piano: (f) => calls.push(`piano ${f}`),
    drum: (type) => calls.push(`drum ${type}`),
    guitar: (f) => calls.push(`guitar ${f}`),
    flute: (f) => calls.push(`flute ${f}`),
  };
  return { out, calls };
}

afterEach(() => vi.useRealTimers());

describe('Sound Safari content', () => {
  it('has a valid source, picture, and explanation for every sound', () => {
    expect(new Set(safariSounds.map((sound) => sound.id)).size).toBe(safariSounds.length);
    for (const sound of safariSounds) {
      expect(illustrationFor(sound.emoji), sound.name).toBeTruthy();
      expect(sound.explanation.length).toBeGreaterThan(5);
      if (sound.category === 'animals') expect(sound.source.kind).toBe('spoken');
      if (sound.category === 'instruments') expect(sound.source.kind).toBe('synth');
      for (const other of sound.similar) expect(safariSounds.some((item) => item.id === other)).toBe(true);
    }
  });

  it('only uses animals from the app and their own sounds', () => {
    for (const sound of soundsFor('animals')) {
      const animal = animalData.find((item) => item.name === sound.name);
      expect(animal, sound.name).toBeTruthy();
    }
  });
});

describe('Sound Safari questions', () => {
  it('has the level number of distinct choices including the answer', () => {
    for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
      for (const category of ['instruments', 'animals'] as const) {
        for (let seed = 1; seed <= 30; seed += 1) {
          const question = createSafariQuestion(category, difficulty, mulberry32(seed));
          expect(question.choices).toHaveLength(safariChoices[difficulty]);
          expect(new Set(question.choices.map((item) => item.id)).size).toBe(question.choices.length);
          expect(question.choices).toContainEqual(question.sound);
        }
      }
    }
  });

  it('keeps look-alike sounds apart below Champion level', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const question = createSafariQuestion('instruments', 'intermediate', mulberry32(seed));
      for (const choice of question.choices) expect(question.sound.similar).not.toContain(choice.id);
    }
  });

  it('does not repeat the previous sound', () => {
    for (let seed = 1; seed <= 30; seed += 1) expect(createSafariQuestion('animals', 'beginner', mulberry32(seed), 'cow').sound.id).not.toBe('cow');
  });
});

describe('Phrase player', () => {
  it('plays a phrase in order and then reports it is done', () => {
    vi.useFakeTimers();
    const { out, calls } = fakeOutput();
    const done = vi.fn();
    expect(createPhrasePlayer(out).play('drum', 1, done)).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(calls).toEqual(['drum kick', 'drum snare', 'drum kick', 'drum kick', 'drum snare']);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('cancels the old phrase when a replay starts, so sounds never overlap', () => {
    vi.useFakeTimers();
    const { out, calls } = fakeOutput();
    const player = createPhrasePlayer(out);
    player.play('piano', 1);
    vi.advanceTimersByTime(10);
    player.play('flute', 1);
    vi.advanceTimersByTime(5000);
    expect(calls.filter((call) => call.startsWith('piano'))).toHaveLength(1);
    expect(calls.filter((call) => call.startsWith('flute'))).toHaveLength(3);
  });

  it('keeps going when the audio device fails', () => {
    vi.useFakeTimers();
    const out: AudioOutput = { piano: () => { throw new Error('no audio'); }, drum: () => {}, guitar: () => {}, flute: () => {} };
    const done = vi.fn();
    expect(createPhrasePlayer(out).play('piano', 1, done)).toBe(true);
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    expect(done).toHaveBeenCalled();
  });

  it('stops everything', () => {
    vi.useFakeTimers();
    const { out, calls } = fakeOutput();
    const player = createPhrasePlayer(out);
    player.play('guitar', 1);
    player.stop();
    vi.advanceTimersByTime(5000);
    expect(calls).toHaveLength(0);
  });
});

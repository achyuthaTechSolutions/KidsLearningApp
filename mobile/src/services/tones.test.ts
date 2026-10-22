import { encodeWav, instrumentTone } from './tones';

describe('tone files', () => {
  it('writes a wav header and keeps piano and flute shapes different', () => {
    const piano = instrumentTone('piano', 440);
    const flute = instrumentTone('flute', 440);
    const wav = encodeWav(piano);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF');
    expect(String.fromCharCode(...wav.slice(8, 12))).toBe('WAVE');
    expect(wav.length).toBe(44 + piano.length * 2);
    expect(piano).not.toEqual(flute);
  });
});

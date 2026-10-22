/** Short synthesized tones. Each instrument uses its own wave and envelope, matching the web studio. */

const SAMPLE_RATE = 22050;

export function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) bytes[offset + i] = value.charCodeAt(i);
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return bytes;
}

function silence(duration: number): Float32Array {
  return new Float32Array(Math.max(1, Math.floor(SAMPLE_RATE * duration)));
}

function mix(into: Float32Array, value: number, index: number): void {
  if (index >= 0 && index < into.length) into[index] += value;
}

function tone(frequency: number, duration: number, shape: 'sine' | 'triangle', attack: number, release: number): Float32Array {
  const samples = silence(duration);
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / SAMPLE_RATE;
    const phase = (frequency * t) % 1;
    const wave = shape === 'sine'
      ? Math.sin(phase * Math.PI * 2)
      : 2 * Math.abs(2 * phase - 1) - 1;
    const envIn = Math.min(1, t / Math.max(attack, 0.001));
    const remaining = duration - t;
    const envOut = Math.min(1, remaining / Math.max(release, 0.001));
    samples[i] = wave * Math.min(envIn, envOut);
  }
  return samples;
}

function noise(duration: number, decay: number): Float32Array {
  const samples = silence(duration);
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / SAMPLE_RATE;
    samples[i] = (Math.random() * 2 - 1) * Math.exp(-t / Math.max(decay, 0.01));
  }
  return samples;
}

function scale(samples: Float32Array, amount: number): Float32Array {
  const next = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) next[i] = samples[i] * amount;
  return next;
}

function add(a: Float32Array, b: Float32Array): Float32Array {
  const next = new Float32Array(Math.max(a.length, b.length));
  for (let i = 0; i < next.length; i += 1) next[i] = (a[i] ?? 0) + (b[i] ?? 0);
  return next;
}

export type ToneKind = 'piano' | 'xylophone' | 'guitar' | 'flute' | 'confirm' | 'success' | 'error' | 'jump';

export function instrumentTone(kind: ToneKind, frequency: number): Float32Array {
  if (kind === 'xylophone') return scale(tone(frequency, 0.7, 'triangle', 0.01, 0.45), 0.7);
  if (kind === 'guitar') {
    const first = tone(frequency, 0.9, 'triangle', 0.03, 0.55);
    const second = tone(frequency * 1.005, 0.9, 'triangle', 0.03, 0.55);
    return scale(add(first, second), 0.35);
  }
  if (kind === 'flute') return scale(tone(frequency, 0.8, 'sine', 0.12, 0.28), 0.55);
  if (kind === 'confirm') return scale(tone(frequency, 0.12, 'sine', 0.01, 0.06), 0.45);
  if (kind === 'jump') return scale(tone(frequency, 0.12, 'triangle', 0.01, 0.05), 0.4);
  return scale(tone(frequency, 0.5, 'triangle', 0.02, 0.28), 0.55);
}

export function drumTone(type: string): Float32Array {
  if (type === 'kick') {
    const samples = silence(0.3);
    for (let i = 0; i < samples.length; i += 1) {
      const t = i / SAMPLE_RATE;
      const freq = 150 * Math.pow(30 / 150, t / 0.3);
      samples[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.12) * 0.7;
    }
    return samples;
  }
  if (type === 'snare') return scale(noise(0.15, 0.05), 0.45);
  if (type === 'hihat') return scale(noise(0.05, 0.015), 0.28);
  if (type === 'tom') {
    const samples = silence(0.25);
    for (let i = 0; i < samples.length; i += 1) {
      const t = i / SAMPLE_RATE;
      const freq = 120 * Math.pow(50 / 120, t / 0.25);
      samples[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.1) * 0.6;
    }
    return samples;
  }
  if (type === 'crash') return scale(noise(0.4, 0.12), 0.32);
  if (type === 'clap') return scale(noise(0.1, 0.03), 0.4);
  return silence(0.05);
}

export function chord(frequencies: number[], duration: number): Float32Array {
  let mixed = silence(duration);
  frequencies.forEach((frequency, index) => {
    const note = tone(frequency, duration, 'sine', 0.01, 0.08);
    const offset = Math.floor(SAMPLE_RATE * index * 0.12);
    for (let i = 0; i < note.length; i += 1) mix(mixed, note[i] * 0.35, i + offset);
  });
  return mixed;
}

export function successTone(): Float32Array {
  return chord([523.25, 659.25, 783.99, 1046.5], 0.28);
}

export function errorTone(): Float32Array {
  return chord([392, 311], 0.28);
}

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function suspendAudio(): void {
  if (audioCtx && audioCtx.state === 'running') {
    void audioCtx.suspend();
  }
}

export function resumeAudio(): void {
  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
}

export function isAudioAvailable(): boolean {
  return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
}

function gentleWave(waveType: OscillatorType): OscillatorType {
  if (waveType === 'square' || waveType === 'sawtooth') return 'triangle';
  return waveType;
}

function playSoftTone(
  frequency: number,
  duration: number,
  volume: number,
  waveType: OscillatorType = 'sine',
  lowpass = 1600,
): void {
  if (volume <= 0) return;
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const attack = Math.min(0.04, Math.max(0.012, duration * 0.28));
  const releaseAt = now + Math.max(duration, attack + 0.05);

  osc.type = gentleWave(waveType);
  osc.frequency.setValueAtTime(frequency, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(lowpass, now);
  filter.Q.setValueAtTime(0.5, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume * 0.62, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, releaseAt);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(releaseAt + 0.02);
}

export function playNote(frequency: number, duration = 0.5, volume = 0.3, waveType: OscillatorType = 'sine'): void {
  try {
    playSoftTone(frequency, duration, volume, waveType);
  } catch {
    // Audio unavailable
  }
}

export function playXylophone(frequency: number, volume = 0.3): void {
  try {
    playSoftTone(frequency, 0.7, volume * 0.8, 'triangle', 2200);
  } catch {
    // Audio unavailable
  }
}

export function playDrum(type: string, volume = 0.4): void {
  try {
    const ctx = getContext();

    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.55, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'snare') {
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.28, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
    } else if (type === 'hihat') {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2800, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.16, ctx.currentTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
    } else if (type === 'tom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'crash') {
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.22, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
    } else if (type === 'clap') {
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.28, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
    }
  } catch {
    // Audio unavailable
  }
}

export function playGuitar(frequency: number, volume = 0.3): void {
  try {
    if (volume <= 0) return;
    const ctx = getContext();
    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(0.6, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    filter.connect(gain);
    gain.connect(ctx.destination);

    [1, 1.005].forEach((ratio) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency * ratio, now);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + 0.92);
    });
  } catch {
    // Audio unavailable
  }
}

export function playFlute(frequency: number, volume = 0.25): void {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.55, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Audio unavailable
  }
}

export function playConfirmation(volume = 0.2): void {
  playNote(523.25, 0.1, volume);
  setTimeout(() => playNote(659.25, 0.1, volume), 100);
  setTimeout(() => playNote(783.99, 0.15, volume), 200);
}

export function playSuccess(volume = 0.2): void {
  playNote(523.25, 0.15, volume);
  setTimeout(() => playNote(659.25, 0.15, volume), 150);
  setTimeout(() => playNote(783.99, 0.15, volume), 300);
  setTimeout(() => playNote(1046.50, 0.3, volume), 450);
}

export function playError(volume = 0.15): void {
  playNote(392, 0.18, volume * 0.75, 'sine');
  setTimeout(() => playNote(311, 0.32, volume * 0.65, 'sine'), 170);
}

export async function playMelody(
  notes: { note: string; duration: number }[],
  noteFrequencies: Record<string, number>,
  volume = 0.3
): Promise<void> {
  let time = 0;
  for (const { note, duration } of notes) {
    const freq = noteFrequencies[note];
    if (freq) {
      setTimeout(() => playNote(freq, duration * 0.9, volume), time * 1000);
    }
    time += duration;
  }
}

export function disposeAudio(): void {
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close();
    audioCtx = null;
  }
}

import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync, type AudioPlayer } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { drumTone, encodeWav, errorTone, instrumentTone, successTone, type ToneKind } from './tones';

const live = new Set<AudioPlayer>();
const cache = new Map<string, string>();
let ready = false;
let failed = false;

export function isAudioReady(): boolean {
  return ready && !failed;
}

export async function prepareAudio(): Promise<void> {
  if (ready || failed) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
    await setIsAudioActiveAsync(true);
    ready = true;
  } catch {
    failed = true;
  }
}

function toneFile(id: string, samples: Float32Array): string | null {
  const cached = cache.get(id);
  if (cached) return cached;
  try {
    const folder = new Directory(Paths.cache, 'kids-tones');
    if (!folder.exists) folder.create();
    const file = new File(folder, `${id}.wav`);
    if (!file.exists) file.create();
    file.writeSync(encodeWav(samples));
    cache.set(id, file.uri);
    return file.uri;
  } catch {
    failed = true;
    return null;
  }
}

function playUri(uri: string, volume: number): void {
  if (volume <= 0) return;
  try {
    const player = createAudioPlayer(uri);
    player.volume = Math.min(1, Math.max(0, volume));
    live.add(player);
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return;
      subscription.remove();
      live.delete(player);
      player.remove();
    });
    player.play();
  } catch {
    failed = true;
  }
}

function playSamples(id: string, samples: Float32Array, volume: number): void {
  if (!ready || failed || volume <= 0) return;
  const uri = toneFile(id, samples);
  if (uri) playUri(uri, volume);
}

export function playInstrument(kind: ToneKind, frequency: number, volume: number): void {
  const id = `${kind}-${Math.round(frequency * 100)}`;
  playSamples(id, instrumentTone(kind, frequency), volume);
}

export function playDrum(type: string, volume: number): void {
  playSamples(`drum-${type}`, drumTone(type), volume);
}

export function playSuccess(volume: number): void {
  playSamples('success', successTone(), volume);
}

export function playError(volume: number): void {
  playSamples('error', errorTone(), volume);
}

export function playConfirmation(volume: number): void {
  playInstrument('confirm', 523.25, volume);
  setTimeout(() => playInstrument('confirm', 659.25, volume), 100);
  setTimeout(() => playInstrument('confirm', 783.99, volume), 200);
}

/** Stops every generated tone. Used when the app leaves the foreground or a screen closes. */
export function stopAllAudio(): void {
  for (const player of live) {
    try {
      player.pause();
      player.remove();
    } catch {
      // The player may already have finished.
    }
  }
  live.clear();
}

export async function suspendAudio(): Promise<void> {
  stopAllAudio();
  try {
    await setIsAudioActiveAsync(false);
  } catch {
    // The session may already be inactive.
  }
}

export async function resumeAudio(): Promise<void> {
  if (failed) return;
  try {
    await setIsAudioActiveAsync(true);
    ready = true;
  } catch {
    failed = true;
  }
}

export function audioPlayerCount(): number {
  return live.size;
}

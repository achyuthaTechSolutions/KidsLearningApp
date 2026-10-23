import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { cancelSpeech, speak } from '../../../services/speech';
import { storyAssets } from '../assets';
import { languageInfo, type Lang } from '../engine/types';

/**
 * Narration for Story Time. It follows the parent's speech, speed, voice, and volume
 * settings, plus the story's own Voice switch. Each line plays its recorded file when
 * one is bundled (see `assets.ts`), otherwise the device voice for the chosen language,
 * otherwise text only. Narration stops when the screen hides or the player closes.
 */
export function useNarration(lang: Lang) {
  const settings = useAppStore((s) => s.settings);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const [unavailable, setUnavailable] = useState<Lang | null>(null);
  const recording = useRef<HTMLAudioElement | null>(null);
  const stopAll = useCallback(() => {
    recording.current?.pause();
    recording.current = null;
    cancelSpeech();
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.hidden) stopAll();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      stopAll();
    };
  }, [stopAll]);

  useEffect(() => {
    stopAll();
  }, [lang, stopAll]);

  /**
   * Speaks `text`. `audio` is a narration id: the line's own `audio` entry, or
   * `<lang>/<text key>` by convention. A bundled recording plays instead of the voice.
   * `onEnd` is told whether anything was heard, so a page turned by the player waits
   * for reading time when nothing was read aloud.
   */
  const say = useCallback((text: string, onEnd?: (spoken: boolean) => void, audio?: string) => {
    const current = settingsRef.current;
    if (!current.speechEnabled || !current.storyNarration || current.volume <= 0) {
      onEnd?.(false);
      return;
    }
    stopAll();
    let missing = false;
    const voice = () => speak(text, {
      rate: current.speechRate,
      voice: lang === 'en' ? current.selectedVoice || undefined : undefined,
      lang,
      langTag: languageInfo[lang].speechTag,
      onEnd: () => onEnd?.(!missing),
      onUnavailable: () => {
        missing = true;
        setUnavailable(lang);
      },
    });
    const url = audio ? storyAssets.narrationUrl(audio) : undefined;
    if (!url) {
      voice();
      return;
    }
    const player = new Audio(url);
    player.volume = Math.min(1, Math.max(0, current.volume));
    player.onended = () => {
      if (recording.current === player) onEnd?.(true);
    };
    recording.current = player;
    // If the file cannot play, fall back to the voice so the child still hears the line.
    player.play().catch(() => {
      if (recording.current === player) voice();
    });
  }, [lang, stopAll]);

  return { say, stop: stopAll, voiceMissing: unavailable === lang, narrationOn: settings.speechEnabled && settings.storyNarration };
}

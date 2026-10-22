import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { cancelSpeech, speak } from '../../../services/speech';
import { languageInfo, type Lang } from '../engine/types';

/**
 * Narration for Story Time. It follows the parent's speech, speed, voice, and volume
 * settings, plus the story's own Voice switch. Recorded narration is not bundled yet,
 * so lines use the device voice for the chosen language, or show text only when the
 * device has none. Speech stops when the screen hides or the player closes.
 */
export function useNarration(lang: Lang) {
  const settings = useAppStore((s) => s.settings);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const [unavailable, setUnavailable] = useState<Lang | null>(null);

  useEffect(() => {
    const onHide = () => {
      if (document.hidden) cancelSpeech();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      cancelSpeech();
    };
  }, []);

  useEffect(() => {
    cancelSpeech();
  }, [lang]);

  const say = useCallback((text: string, onEnd?: () => void) => {
    const current = settingsRef.current;
    if (!current.speechEnabled || !current.storyNarration || current.volume <= 0) {
      onEnd?.();
      return;
    }
    cancelSpeech();
    speak(text, {
      rate: current.speechRate,
      voice: lang === 'en' ? current.selectedVoice || undefined : undefined,
      lang,
      langTag: languageInfo[lang].speechTag,
      onEnd,
      onUnavailable: () => setUnavailable(lang),
    });
  }, [lang]);

  const stop = useCallback(() => cancelSpeech(), []);

  return { say, stop, voiceMissing: unavailable === lang, narrationOn: settings.speechEnabled && settings.storyNarration };
}

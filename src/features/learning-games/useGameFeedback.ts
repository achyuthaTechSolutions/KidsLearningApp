import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cancelSpeech, speak } from '../../services/speech';

/**
 * Speech and sound for the Play games. It reads the latest parent settings on
 * every call, so callbacks can live inside animation loops and timers.
 */
export function useGameFeedback() {
  const settings = useAppStore((s) => s.settings);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => () => cancelSpeech(), []);

  const say = useCallback((text: string, onEnd?: () => void) => {
    const current = settingsRef.current;
    if (!current.speechEnabled) {
      onEnd?.();
      return;
    }
    cancelSpeech();
    speak(text, { rate: current.speechRate, voice: current.selectedVoice || undefined, onEnd });
  }, []);

  const sound = useCallback((play: (volume: number) => void) => {
    const current = settingsRef.current;
    if (current.soundEnabled && current.volume > 0) play(current.volume);
  }, []);

  return { say, sound, settings };
}

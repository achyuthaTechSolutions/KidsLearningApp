import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { playConfirmation, playError, playSuccess } from '../services/audio';
import { cancelSpeech, speak, speakLines } from '../services/speech';

export function useLearning() {
  const settings = useAppStore((state) => state.settings);

  const say = useCallback((text: string) => {
    if (!settings.speechEnabled) return;
    cancelSpeech();
    speak(text, { rate: settings.speechRate, voice: settings.selectedVoice, volume: settings.volume });
  }, [settings.speechEnabled, settings.speechRate, settings.selectedVoice, settings.volume]);

  const sayLines = useCallback((lines: string[]) => {
    if (!settings.speechEnabled) return;
    cancelSpeech();
    speakLines(lines, { rate: settings.speechRate, voice: settings.selectedVoice, volume: settings.volume });
  }, [settings.speechEnabled, settings.speechRate, settings.selectedVoice, settings.volume]);

  const chime = useCallback(() => {
    if (settings.soundEnabled) playConfirmation(settings.volume);
  }, [settings.soundEnabled, settings.volume]);

  const success = useCallback(() => {
    if (settings.soundEnabled) playSuccess(settings.volume);
  }, [settings.soundEnabled, settings.volume]);

  const mistake = useCallback(() => {
    if (settings.soundEnabled) playError(settings.volume);
  }, [settings.soundEnabled, settings.volume]);

  return { settings, say, sayLines, chime, success, mistake };
}

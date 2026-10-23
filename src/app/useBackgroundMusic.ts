import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { duckMusic, setMusicVolume, startMusic, stopMusic } from '../services/music';
import { musicTrackFor } from '../services/musicPatterns';
import { getAudioContext } from '../services/audio';
import { onSpeakingChange } from '../services/speech';

/**
 * Plays the right background music for the page: playful in games and activities,
 * calm in stories, none elsewhere. Follows the parent's Background music switch and
 * Volume, dips under speech, and stops while the app is hidden.
 * The current track is mirrored on <html data-music> for tests.
 */
export function useBackgroundMusic() {
  const { pathname } = useLocation();
  const enabled = useAppStore((s) => s.settings.backgroundMusic);
  const volume = useAppStore((s) => s.settings.volume);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const track = enabled && volume > 0 && !hidden ? musicTrackFor(pathname) : null;

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => onSpeakingChange(duckMusic), []);

  useEffect(() => {
    setMusicVolume(volume);
  }, [volume]);

  useEffect(() => {
    document.documentElement.dataset.music = track ?? 'off';
    if (!track) {
      stopMusic();
      return undefined;
    }
    startMusic(track);
    // Browsers keep audio silent until the first tap or key press: wake it then.
    const wake = () => {
      const ctx = getAudioContext();
      if (ctx?.state === 'suspended') void ctx.resume();
    };
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [track]);

  useEffect(() => () => stopMusic(), []);
}

import { closeTopOverlay } from './overlays';
import { suspendAudio, resumeAudio } from '../services/audio';
import { cancelSpeech } from '../services/speech';

/**
 * Android back, pause, and resume. No-op in a normal browser.
 * Returning false from goBack means the app should move to the background.
 */
export async function startNativeApp(goBack: () => boolean): Promise<() => void> {
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) return () => {};

  const { App } = await import('@capacitor/app');
  const { SplashScreen } = await import('@capacitor/splash-screen');
  const handles = await Promise.all([
    App.addListener('backButton', () => {
      if (closeTopOverlay()) return;
      if (!goBack()) void App.minimizeApp();
    }),
    App.addListener('pause', () => {
      cancelSpeech();
      suspendAudio();
    }),
    App.addListener('resume', () => {
      resumeAudio();
    }),
  ]);

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // The status bar plugin is only available inside the Android shell.
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Splash may already be hidden.
  }

  return () => {
    handles.forEach((handle) => {
      void handle.remove();
    });
  };
}

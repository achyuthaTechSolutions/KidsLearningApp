import { lazy, Suspense, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme';
import { useAppStore } from './store/useAppStore';
import { setSpeechVolume } from './services/speech';
import AppLayout from './components/layout/AppLayout';
import GameLoading from './features/learning-games/GameLoading';
import HomePage from './features/home/HomePage';
import KeyboardExplorer from './features/keyboard-explorer/KeyboardExplorer';
import AlphabetWorld from './features/alphabet/AlphabetWorld';
import NumberWorld from './features/numbers/NumberWorld';
import AnimalKingdom from './features/animals/AnimalKingdom';
import MyFirstWords from './features/vocabulary/MyFirstWords';
import MusicStudio from './features/music-studio/MusicStudio';
import LearningGames from './features/learning-games/LearningGames';
import DailyChallenge from './features/daily-challenge/DailyChallenge';
import Achievements from './features/achievements/Achievements';
import ParentSettings from './features/parent-settings/ParentSettings';
import PrivacyPage from './features/privacy/PrivacyPage';
import DinoDash from './features/dino-dash/DinoDash';
import BalloonPop from './features/balloon-pop/BalloonPop';
import MemoryMatch from './features/memory-match/MemoryMatch';
import WordBuilder from './features/word-builder/WordBuilder';

// The newer Play games load on first visit, so the first screen stays quick to open.
const LetterTracing = lazy(() => import('./features/letter-tracing/LetterTracing'));
const AlphabetCatcher = lazy(() => import('./features/alphabet-catcher/AlphabetCatcher'));
const RobotAdventure = lazy(() => import('./features/robot-adventure/RobotAdventure'));
const PuzzlePlanet = lazy(() => import('./features/puzzle-planet/PuzzlePlanet'));
const PhotoPuzzle = lazy(() => import('./features/photo-puzzle/PhotoPuzzle'));
const ShadowDetective = lazy(() => import('./features/shadow-detective/ShadowDetective'));
const SoundSafari = lazy(() => import('./features/sound-safari/SoundSafari'));
const RhythmHero = lazy(() => import('./features/rhythm-hero/RhythmHero'));
const LittleChef = lazy(() => import('./features/little-chef/LittleChef'));
const EmotionExplorer = lazy(() => import('./features/emotion-explorer/EmotionExplorer'));
const SpaceExplorer = lazy(() => import('./features/space-explorer/SpaceExplorer'));

const playRoutes = [
  { path: '/games/tracing', Component: LetterTracing },
  { path: '/games/alphabet-catcher', Component: AlphabetCatcher },
  { path: '/games/robot', Component: RobotAdventure },
  { path: '/games/puzzle', Component: PuzzlePlanet },
  { path: '/games/photo-puzzle', Component: PhotoPuzzle },
  { path: '/games/shadow', Component: ShadowDetective },
  { path: '/games/sound-safari', Component: SoundSafari },
  { path: '/games/rhythm', Component: RhythmHero },
  { path: '/games/chef', Component: LittleChef },
  { path: '/games/emotions', Component: EmotionExplorer },
  { path: '/games/space', Component: SpaceExplorer },
];

export default function App() {
  const themeMode = useAppStore((s) => s.settings.theme);
  const volume = useAppStore((s) => s.settings.volume);
  const reducedMotion = useAppStore((s) => s.settings.reducedMotion);

  useEffect(() => {
    setSpeechVolume(volume);
  }, [volume]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      document.documentElement.dataset.reducedMotion = reducedMotion || media.matches ? 'true' : 'false';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [reducedMotion]);

  const theme = useMemo(() => {
    if (themeMode === 'dark') return darkTheme;
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? darkTheme : lightTheme;
    }
    return lightTheme;
  }, [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/keyboard" element={<KeyboardExplorer />} />
            <Route path="/alphabet" element={<AlphabetWorld />} />
            <Route path="/numbers" element={<NumberWorld />} />
            <Route path="/animals" element={<AnimalKingdom />} />
            <Route path="/words" element={<MyFirstWords />} />
            <Route path="/music" element={<MusicStudio />} />
            <Route path="/games" element={<LearningGames />} />
            <Route path="/daily" element={<DailyChallenge />} />
            <Route path="/dino" element={<DinoDash />} />
            <Route path="/balloons" element={<BalloonPop />} />
            <Route path="/memory" element={<MemoryMatch />} />
            <Route path="/spell" element={<WordBuilder />} />
            {playRoutes.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Suspense fallback={<GameLoading />}><Component /></Suspense>} />
            ))}
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/settings" element={<ParentSettings />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

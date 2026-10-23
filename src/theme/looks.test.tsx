import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAppStore } from '../store/useAppStore';
import { defaultProgress, defaultSettings, loadSettings } from '../services/storage';
import type { AppLook } from '../types';
import { themeFor } from './theme';
import { applyLookFonts, looks } from './looks';
import HomePage from '../features/home/HomePage';
import LearningGames from '../features/learning-games/LearningGames';
import ParentSettings from '../features/parent-settings/ParentSettings';
import { gameCatalog } from '../features/learning-games/catalog';
import { aviPick, filterItems, hubItems } from '../features/learning-games/hubs/hubData';
import { islandFor } from '../features/home/looks/lookStyles';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }),
  });
  Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} });
});

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ progress: { ...defaultProgress, gameRounds: {}, gameLevels: {}, gameSkill: {} }, settings: { ...defaultSettings, speechEnabled: false } });
});

function Where() {
  return <span data-testid="where">{useLocation().pathname}</span>;
}

function renderIn(look: AppLook, ui: ReactElement, path = '/') {
  useAppStore.setState((s) => ({ settings: { ...s.settings, appLook: look } }));
  return render(
    <ThemeProvider theme={themeFor('light', look)}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="*" element={<>{ui}<Where /></>} /></Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('Look setting', () => {
  it('defaults to Classic, keeps a saved look, and ignores an unknown one', () => {
    expect(loadSettings().appLook).toBe('classic');
    localStorage.setItem('kids-learning-settings', JSON.stringify({ appLook: 'map' }));
    expect(loadSettings().appLook).toBe('map');
    localStorage.setItem('kids-learning-settings', JSON.stringify({ appLook: 'neon' }));
    expect(loadSettings().appLook).toBe('classic');
  });

  it('gives each look its own light colours, and keeps the checked dark colours', () => {
    for (const look of ['garden', 'blocks', 'map'] as AppLook[]) {
      const light = themeFor('light', look);
      expect(light.palette.background.default).toBe(looks[look].background);
      expect(light.palette.text.primary).toBe(looks[look].text);
      expect(themeFor('dark', look).palette.background.default).toBe(themeFor('dark', 'classic').palette.background.default);
    }
    expect(themeFor('light', 'garden')).toBe(themeFor('light', 'garden'));
  });

  it('sets the font variables every screen reads', () => {
    applyLookFonts('map');
    expect(document.documentElement.style.getPropertyValue('--kl-font-display')).toBe('"Sniglet"');
    expect(document.documentElement.dataset.look).toBe('map');
    applyLookFonts('classic');
    expect(document.documentElement.style.getPropertyValue('--kl-font-display')).toBe('"Fredoka"');
  });

  it('is picked in Parent Settings', () => {
    renderIn('classic', <ParentSettings />);
    const group = screen.getByRole('radiogroup', { name: 'Look' });
    expect(within(group).getAllByRole('radio')).toHaveLength(4);
    fireEvent.click(within(group).getByRole('radio', { name: /Bright Blocks/ }));
    expect(useAppStore.getState().settings.appLook).toBe('blocks');
    expect(within(group).getByRole('radio', { name: /Bright Blocks/ }).getAttribute('aria-checked')).toBe('true');
  });
});

describe('Home in each look', () => {
  it('Storybook Garden greets with Avi and opens the four big tiles', () => {
    renderIn('garden', <HomePage />);
    expect(screen.getByRole('heading', { level: 1, name: /I'm Avi/ })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Avi waving hello' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Numbers/ }));
    expect(screen.getByTestId('where').textContent).toBe('/numbers');
  });

  it('Bright Blocks has one-word blocks', () => {
    renderIn('blocks', <HomePage />);
    for (const word of ['Stories', 'Letters', 'Numbers', 'Games', 'Animals', 'Badges']) expect(screen.getByRole('button', { name: word })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Games' }));
    expect(screen.getByTestId('where').textContent).toBe('/games');
  });

  it('Adventure Map puts Avi on the island of the last activity', () => {
    useAppStore.setState((s) => ({ progress: { ...s.progress, lastActivity: 'numbers' } }));
    renderIn('map', <HomePage />);
    expect(screen.getByRole('img', { name: 'Avi the little elephant, at Number Bay' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Today's trip with Avi. Today’s questions, then Game Island/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Letter Hill' }));
    expect(screen.getByTestId('where').textContent).toBe('/alphabet');
  });

  it('maps activities to islands', () => {
    expect(islandFor(null)).toBe('stories');
    expect(islandFor('keyboard')).toBe('letters');
    expect(islandFor('games')).toBe('games');
  });
});

describe('Games list in each look', () => {
  it('lists every game and quiz once, with status, filters, and Avi’s pick', () => {
    const progress = { ...defaultProgress, gameRounds: { tracing: 2 }, gameLevels: {}, gameSkill: { racer: 4 } };
    const items = hubItems(progress, [{ type: 'count', title: 'Count the Objects', description: '', emoji: '🔢', world: 'sun' }]);
    expect(items).toHaveLength(gameCatalog.length + 1);
    expect(items.find((item) => item.key === 'racer')?.status).toBe('Level 4');
    expect(items.find((item) => item.key === 'tracing')?.status).toBe('Played 2×');
    expect(aviPick(items).key).toBe('alphabet-catcher');
    expect(filterItems(items, 'numbers').map((item) => item.key)).toEqual(expect.arrayContaining(['racer', 'chef', 'quiz-count']));
  });

  it.each(['garden', 'blocks', 'map'] as AppLook[])('%s shows every game and opens a quiz inside the page', (look) => {
    renderIn(look, <LearningGames />, '/games');
    const buttons = screen.getAllByRole('button');
    for (const game of gameCatalog) expect(buttons.some((b) => b.getAttribute('aria-label')?.startsWith(game.title))).toBe(true);
    fireEvent.click(screen.getAllByRole('button', { name: /^Count the Objects/ })[0]);
    expect(screen.getByTestId('game-level')).toBeTruthy();
  });

  it('Adventure Map marks the first game not tried as the next stop', () => {
    useAppStore.setState((s) => ({ progress: { ...s.progress, gameRounds: { tracing: 1 } } }));
    renderIn('map', <LearningGames />, '/games');
    expect(screen.getByRole('button', { name: /^Letter Tracing. Done/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Alphabet Catcher. Next stop' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Number Bay' }));
    expect(screen.queryByRole('button', { name: /^Letter Tracing/ })).toBeNull();
  });
});

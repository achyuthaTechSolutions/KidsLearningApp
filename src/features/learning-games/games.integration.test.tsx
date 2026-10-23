import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import App from '../../App';
import { lightTheme } from '../../theme/theme';
import { useAppStore } from '../../store/useAppStore';
import { defaultProgress, defaultSettings } from '../../services/storage';
import { gameCatalog } from './catalog';
import LearningGames from './LearningGames';
import AlphabetCatcher from '../alphabet-catcher/AlphabetCatcher';
import RobotAdventure from '../robot-adventure/RobotAdventure';
import LittleChef from '../little-chef/LittleChef';
import PuzzlePlanet from '../puzzle-planet/PuzzlePlanet';
import LetterTracing from '../letter-tracing/LetterTracing';
import EmotionExplorer from '../emotion-explorer/EmotionExplorer';
import RhythmHero from '../rhythm-hero/RhythmHero';
import SoundSafari from '../sound-safari/SoundSafari';
import ShadowDetective from '../shadow-detective/ShadowDetective';
import SpaceExplorer from '../space-explorer/SpaceExplorer';
import { strokesFor } from '../letter-tracing/strokes';
import { sampleStroke } from '../letter-tracing/tracing';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }),
  });
  Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} });
  if (!document.elementFromPoint) Object.defineProperty(document, 'elementFromPoint', { writable: true, value: () => null });
});

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    progress: { ...defaultProgress, gameRounds: {}, gameLevels: {} },
    settings: { ...defaultSettings, gameDifficulty: 'beginner' },
  });
});

afterEach(() => vi.useRealTimers());

function renderGame(ui: ReactElement) {
  return render(<ThemeProvider theme={lightTheme}><MemoryRouter>{ui}</MemoryRouter></ThemeProvider>);
}

describe('Game routes and hub', () => {
  it.each(gameCatalog.filter((game) => game.path.startsWith('/games/')))('opens $title from its route', async ({ path, title }) => {
    window.history.pushState({}, '', path);
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: new RegExp(title) }, { timeout: 4000 })).toBeTruthy();
  });

  it('lists every game in a category on the Games hub', () => {
    renderGame(<LearningGames />);
    for (const game of gameCatalog) expect(screen.getByRole('button', { name: game.title })).toBeTruthy();
    for (const heading of ['Letters and Words', 'Logic and Puzzles', 'Music and Sounds', 'Pretend Play and Feelings', 'Science and Discovery']) {
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    }
  });
});

describe('Alphabet Catcher', () => {
  it('counts a correct catch once, levels up after 3 first tries, and finishes when the child stops', () => {
    renderGame(<AlphabetCatcher />);
    expect(screen.getByTestId('endless-level').textContent).toContain('Level 1');
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    const target = () => screen.getAllByText(/^Catch the letter [A-Z]!$/)[0].textContent!.match(/letter ([A-Z])/)![1];
    expect(within(screen.getByRole('group', { name: 'Letters' })).getAllByRole('button')).toHaveLength(3);
    const first = target();
    fireEvent.click(screen.getByRole('button', { name: `Letter ${first}` }));
    fireEvent.click(screen.getByRole('button', { name: `Letter ${first}` }));
    expect(screen.getByLabelText('1 letters caught')).toBeTruthy();
    for (let i = 0; i < 2; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Next Letter' }));
      fireEvent.click(screen.getByRole('button', { name: `Letter ${target()}` }));
    }
    expect(screen.getByTestId('game-level').textContent).toBe('Level 2');
    expect(useAppStore.getState().progress.gameSkill['alphabet-catcher']).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByText(/You caught 3 letters and reached Level 2! 3 on the first try\./)).toBeTruthy();
  });

  it('lets a keyboard user press the letter key', () => {
    renderGame(<AlphabetCatcher />);
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    const target = screen.getAllByText(/^Catch the letter [A-Z]!$/)[0].textContent!.match(/letter ([A-Z])/)![1];
    fireEvent.keyDown(window, { key: target.toLowerCase() });
    expect(screen.getByRole('button', { name: 'Next Letter' })).toBeTruthy();
  });
});

describe('Little Robot Adventure', () => {
  it('runs a plan and celebrates reaching the flag', () => {
    vi.useFakeTimers();
    renderGame(<RobotAdventure />);
    fireEvent.click(screen.getByRole('button', { name: /Level 1, Straight to the flag/ }));
    for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Move forward' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go!' }));
    expect(screen.getByRole('button', { name: 'Running…' })).toHaveProperty('disabled', true);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getAllByText(/Hooray! The robot made it to the flag!/).length).toBeGreaterThan(0);
    expect(useAppStore.getState().progress.gameLevels.robot).toEqual(['straight']);
  });

  it('explains a bump and lets the child undo', () => {
    vi.useFakeTimers();
    renderGame(<RobotAdventure />);
    fireEvent.click(screen.getByRole('button', { name: /Level 1, Straight/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Turn left' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move forward' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move forward' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go!' }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getAllByText(/off the board\. Look at command 3/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(within(screen.getByRole('list', { name: 'Robot plan' })).getAllByRole('listitem')).toHaveLength(2);
    expect(useAppStore.getState().progress.gameLevels.robot).toBeUndefined();
  });
});

describe('Little Chef', () => {
  it('only adds what the step asks for, and counts to the next step', () => {
    renderGame(<LittleChef />);
    fireEvent.click(screen.getByRole('button', { name: /^Fruit Salad/ }));
    expect(screen.getByRole('heading', { name: 'Add one apple.' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add banana' }));
    expect(screen.getByRole('img', { name: 'The bowl: empty' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add apple' }));
    expect(screen.getByRole('heading', { name: 'Add two bananas.' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add banana' }));
    fireEvent.click(screen.getByRole('button', { name: 'Take one out' }));
    expect(screen.getByRole('img', { name: 'The bowl: apple' })).toBeTruthy();
  });
});

describe('Puzzle Planet', () => {
  it('places a piece by tapping it and then its space', () => {
    renderGame(<PuzzlePlanet />);
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    const piece = screen.getByRole('button', { name: 'Piece from row 1, column 1' });
    fireEvent.pointerDown(piece, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(piece, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    expect(screen.getByRole('button', { name: 'Piece from row 1, column 1, picked up' })).toBeTruthy();
    fireEvent.click(screen.getByRole('gridcell', { name: 'Empty space, row 1, column 2' }));
    expect(screen.getByText('0 of 4 pieces placed')).toBeTruthy();
    fireEvent.click(screen.getByRole('gridcell', { name: 'Empty space, row 1, column 1' }));
    expect(screen.getByText('1 of 4 pieces placed')).toBeTruthy();
  });

  it('works with the keyboard too', () => {
    renderGame(<PuzzlePlanet />);
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Piece from row 2, column 2' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('gridcell', { name: 'Empty space, row 2, column 2' }));
    expect(screen.getByText('1 of 4 pieces placed')).toBeTruthy();
  });
});

describe('Letter Tracing', () => {
  it('marks a letter traced when the path is followed', () => {
    renderGame(<LetterTracing />);
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    const surface = screen.getByRole('img', { name: /Tracing area for the letter A/ });
    surface.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    strokesFor('A').forEach((stroke, i) => {
      const points = sampleStroke(stroke, 2);
      fireEvent.pointerDown(surface, { pointerId: i + 1, clientX: points[0].x, clientY: points[0].y });
      for (const point of points.slice(1)) fireEvent.pointerMove(surface, { pointerId: i + 1, clientX: point.x, clientY: point.y });
      fireEvent.pointerUp(surface, { pointerId: i + 1 });
    });
    expect(screen.getByText('Letter traced!')).toBeTruthy();
    expect(useAppStore.getState().progress.gameLevels.tracing).toEqual(['A']);
  });

  it('does not count a single dot', () => {
    renderGame(<LetterTracing />);
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    const surface = screen.getByRole('img', { name: /Tracing area/ });
    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 50, clientY: 50 });
    fireEvent.pointerUp(surface, { pointerId: 1 });
    expect(screen.queryByText('Letter traced!')).toBeNull();
  });
});

describe('Emotion Explorer', () => {
  it('gives kind feedback and moves on', () => {
    renderGame(<EmotionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    const options = within(screen.getByRole('group', { name: 'Feelings' })).getAllByRole('button');
    expect(options).toHaveLength(2);
    fireEvent.click(options[0]);
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
    expect(screen.queryByText(/wrong/i)).toBeNull();
  });
});

describe('Rhythm Hero', () => {
  it('plays a beat, then accepts it copied in practice mode', () => {
    vi.useFakeTimers();
    renderGame(<RhythmHero />);
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    expect(screen.getAllByText('Listen and watch the pads…').length).toBeGreaterThan(0);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(screen.getAllByText(/Your turn!/).length).toBeGreaterThan(0);
    const drum = screen.getByRole('button', { name: 'Drum pad, key 1' });
    for (let i = 0; i < 3 && !screen.queryByRole('button', { name: 'Next Rhythm' }); i += 1) fireEvent.pointerDown(drum);
    expect(screen.getByRole('button', { name: 'Next Rhythm' })).toBeTruthy();
  });
});

describe('Sound Safari', () => {
  it('explains when this device cannot play sounds and does not start', () => {
    renderGame(<SoundSafari />);
    expect(screen.getByText(/Music Studio sounds need sound effects/)).toBeTruthy();
    expect(screen.getByRole('button', { name: "Let's play!" })).toHaveProperty('disabled', true);
  });
});

describe('Shadow Detective', () => {
  it('lets the child keep trying until the shadow matches', () => {
    renderGame(<ShadowDetective />);
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    const pictures = within(screen.getByRole('group', { name: 'Pictures' })).getAllByRole('button');
    for (const picture of pictures) {
      if (screen.queryByRole('button', { name: 'Next Shadow' })) break;
      fireEvent.click(picture);
    }
    expect(screen.getByRole('button', { name: 'Next Shadow' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Shadow solved/ })).toBeTruthy();
  });
});

describe('Space Explorer', () => {
  it('opens Mars only after the Moon is explored, and saves it', () => {
    renderGame(<SpaceExplorer />);
    expect(screen.getByRole('button', { name: /Mars\. Locked\. Visit The Moon first/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^The Moon\./ }));
    for (let i = 0; i < 3; i += 1) {
      const options = screen.getAllByRole('button').filter((button) => /^\d+$/.test(button.textContent ?? ''));
      fireEvent.click(options[0]);
      fireEvent.click(screen.getByRole('button', { name: i < 2 ? 'Next' : 'Land!' }));
    }
    expect(screen.getByRole('heading', { name: 'You explored The Moon!' })).toBeTruthy();
    expect(useAppStore.getState().progress.gameLevels.space).toEqual(['moon']);
    fireEvent.click(screen.getByRole('button', { name: 'Back to the map' }));
    expect(screen.getByRole('button', { name: /^Mars\. Find the letters/ })).toBeTruthy();
  });
});

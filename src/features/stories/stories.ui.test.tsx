import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { lightTheme } from '../../theme/theme';
import { useAppStore } from '../../store/useAppStore';
import { defaultProgress, defaultSettings, loadStoryProgress } from '../../services/storage';
import StoryLibrary from './StoryLibrary';
import StoryPlayerRoute from './player/StoryPlayer';
import PebblePot from './activities/PebblePot';
import { BarGraphView } from './activities/MoreActivities';
import { thirstyCrow } from './content/thirstyCrow';
import { cooperativeDoves } from './content/cooperativeDoves';
import type { BarGraphActivity, PebblePotActivity } from './engine/types';

// Pretend the device has no Telugu voice, so the text-only fallback shows.
vi.mock('../../services/speech', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/speech')>();
  return {
    ...actual,
    speak: vi.fn((_text: string, options?: { lang?: string; onUnavailable?: () => void; onEnd?: () => void }) => {
      if (options?.lang === 'te') options.onUnavailable?.();
      options?.onEnd?.();
    }),
  };
});

beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} });
});

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    progress: { ...defaultProgress, gameRounds: {}, gameLevels: {} },
    settings: { ...defaultSettings, storyLanguage: 'en' },
  });
});

function renderAt(path: string) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/stories" element={<StoryLibrary />} />
          <Route path="/stories/:storyId" element={<StoryPlayerRoute />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const caption = () => screen.getByTestId('caption').textContent;
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }));

describe('Story library', () => {
  it('shows all five stories with their details, in the chosen language', () => {
    renderAt('/stories');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Kalu and the Thirsty Crow' })).toBeTruthy();
    expect(screen.getAllByText(/About \d+ minutes/)).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'తెలుగు' }));
    expect(screen.getByRole('heading', { name: 'కాలూ, దాహం వేసిన కాకి' })).toBeTruthy();
    expect(useAppStore.getState().settings.storyLanguage).toBe('te');
  });

  it('filters by age and offers to continue a started story', () => {
    renderAt('/stories');
    fireEvent.click(screen.getByRole('button', { name: 'Ages 7–8' }));
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.queryByRole('heading', { name: 'Kalu and the Thirsty Crow' })).toBeNull();
  });
});

describe('Story player', () => {
  it('reads line by line, keeps the place when the language changes, and resumes later', () => {
    const { unmount } = renderAt('/stories/thirsty-crow');
    expect(caption()).toBe('It was a hot summer day. The sun was shining bright.');
    next();
    expect(caption()).toBe('Caw! I am so thirsty. Where can I find water?');
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    expect(caption()).toBe('काँव! मुझे बहुत प्यास लगी है। पानी कहाँ मिलेगा?');
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(loadStoryProgress().stories['thirsty-crow'].playback).toMatchObject({ sceneId: 'hot-day', lineIndex: 1 });
    unmount();
    renderAt('/stories/thirsty-crow');
    expect(caption()).toBe('Caw! I am so thirsty. Where can I find water?');
  });

  it('keeps going as text when the device has no voice for the language', () => {
    useAppStore.setState({ settings: { ...defaultSettings, storyLanguage: 'te' } });
    renderAt('/stories/thirsty-crow');
    expect(screen.getByText(/ఈ పరికరంలో ఈ భాషకు గొంతు లేదు/)).toBeTruthy();
    expect(caption()).toBe('అది ఒక వేడి వేసవి రోజు. సూర్యుడు బాగా ప్రకాశిస్తున్నాడు.');
    fireEvent.click(screen.getByRole('button', { name: 'తర్వాత' }));
    expect(caption()).toContain('దాహంగా');
  });

  it('can hide the words while keeping them for screen readers', () => {
    renderAt('/stories/thirsty-crow');
    fireEvent.click(screen.getByRole('switch', { name: 'Words' }));
    expect(screen.queryByTestId('caption')).toBeNull();
    expect(screen.getByText('It was a hot summer day. The sun was shining bright.')).toBeTruthy();
  });

  it('records an answered question and moves to the next scene', () => {
    renderAt('/stories/thirsty-crow');
    next(); next(); next();
    next(); next();
    fireEvent.click(screen.getByRole('button', { name: /^Yes, easily/ }));
    expect(screen.getByText('Look at the pot. Is the water near the top or near the bottom?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^No, the water is too low/ }));
    next();
    const events = loadStoryProgress().events;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ activityId: 'can-reach', solved: true, clean: false, tries: 2 });
  });

  it('shows a friendly message for an unknown story', () => {
    renderAt('/stories/not-a-story');
    expect(screen.getByText('We could not find that story.')).toBeTruthy();
  });
});

describe('Pebble pot', () => {
  const pot = thirstyCrow.scenes.find((scene) => scene.id === 'pebbles')!.activity as PebblePotActivity;

  it('raises the water, asks for a prediction, and offers a demonstration after two misses', () => {
    const solved = vi.fn();
    render(<ThemeProvider theme={lightTheme}><PebblePot activity={pot} lang="en" say={() => {}} onSolved={solved} /></ThemeProvider>);
    const drop = () => fireEvent.click(screen.getAllByRole('button', { name: /^Drop a pebble/ })[0]);
    drop(); drop();
    expect(screen.getByText('Pebbles in the pot: 2')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /How many more pebbles/ })).toBeTruthy();
    expect(screen.queryAllByRole('button', { name: /^Drop a pebble/ })).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByText(/Each pebble lifts the water one step/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show me' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));
    fireEvent.click(screen.getByRole('button', { name: '2, correct' }));
    drop(); drop();
    expect(screen.getByRole('heading', { name: 'The water is high enough. Kalu can drink!' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(solved).toHaveBeenCalledTimes(1);
    expect(solved.mock.calls[0][0]).toMatchObject({ solved: true, clean: false, demoShown: true });
  });
});

describe('Bar graph', () => {
  const graph = cooperativeDoves.scenes.find((scene) => scene.activity?.kind === 'bar-graph')!.activity as BarGraphActivity;

  it('builds bars only up to the real counts, then checks the answers', () => {
    const solved = vi.fn();
    render(<ThemeProvider theme={lightTheme}><BarGraphView activity={graph} lang="en" say={() => {}} onSolved={solved} /></ThemeProvider>);
    const figure = () => screen.getByRole('figure');
    for (const category of graph.categories) {
      for (let i = 0; i < category.value + 2; i += 1) {
        const button = screen.queryByRole('button', { name: new RegExp(`^Add one to ${category.label.en}`) });
        if (button && !button.hasAttribute('disabled')) fireEvent.click(button);
      }
    }
    expect(figure().getAttribute('aria-label')).toBe('Bar graph. White doves: 6, Blue doves: 3, Dark doves: 4');
    expect(screen.getByRole('heading', { name: 'Which group found the most grains?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Blue doves$/ }));
    expect(screen.getByText('Not quite. Try again!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^White doves$/ }));
    expect(screen.getByRole('heading', { name: 'Which group found the fewest grains?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Blue doves$/ }));
    expect(screen.getByRole('heading', { name: /How many more grains/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(solved).toHaveBeenCalledTimes(1);
  });
});

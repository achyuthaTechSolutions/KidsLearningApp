import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { lightTheme } from '../../theme/theme';
import { useAppStore } from '../../store/useAppStore';
import { defaultProgress, defaultSettings } from '../../services/storage';
import { PHOTOS_KEY, addPhoto, savePhotos } from './photos';
import PhotoPuzzle from './PhotoPuzzle';

const jpeg = 'data:image/jpeg;base64,/9j/4AAQ';

// jsdom has no canvas, so decoding and resizing is stubbed. photos.test.ts covers the rules.
vi.mock('./photos', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./photos')>();
  return { ...actual, preparePhoto: vi.fn(async () => jpeg) };
});

beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} });
});

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ progress: { ...defaultProgress, gameRounds: {}, gameLevels: {} }, settings: { ...defaultSettings } });
});

function renderGame() {
  return render(<ThemeProvider theme={lightTheme}><MemoryRouter><PhotoPuzzle /></MemoryRouter></ThemeProvider>);
}

function passParentCheck() {
  fireEvent.click(screen.getByRole('button', { name: 'Grown-ups: add or delete photos' }));
  const dialog = screen.getByRole('dialog');
  const [, left, right] = within(dialog).getByText(/What is \d+ \+ \d+\?/).textContent!.match(/(\d+) \+ (\d+)/)!;
  fireEvent.change(within(dialog).getByLabelText('Parent check answer'), { target: { value: String(Number(left) + Number(right)) } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));
}

describe('My Photo Puzzle', () => {
  it('asks for a grown-up when there are no photos, and cannot start', () => {
    renderGame();
    expect(screen.getByText('No photos yet. Ask a grown-up to add one!')).toBeTruthy();
    expect(screen.getByRole('button', { name: "Let's play!" })).toHaveProperty('disabled', true);
  });

  it('keeps photo controls behind the parent check', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Grown-ups: add or delete photos' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Parent check answer'), { target: { value: '0' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));
    expect(within(dialog).getByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Choose a photo' })).toBeNull();
  });

  it('lets a grown-up add a named photo, saved on this device, and delete it', async () => {
    renderGame();
    passParentCheck();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText(/Nothing is uploaded or shared/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Photo name (optional)'), { target: { value: 'Grandma' } });
    const file = new File(['x'], 'grandma.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByTestId('photo-file'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/Added "Grandma"/)).toBeTruthy());
    expect(JSON.parse(localStorage.getItem(PHOTOS_KEY)!)[0].name).toBe('Grandma');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Grandma' }));
    expect(localStorage.getItem(PHOTOS_KEY)).toBeNull();
  });

  it('turns a saved photo into a playable puzzle', () => {
    savePhotos(addPhoto([], jpeg, 'Our dog'));
    renderGame();
    expect(screen.getByRole('radio', { name: 'Our dog' })).toHaveProperty('ariaChecked', 'true');
    fireEvent.click(screen.getByRole('button', { name: "Let's play!" }));
    expect(screen.getByRole('grid', { name: 'Puzzle board for Our dog' })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Piece from row 1, column 1' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('gridcell', { name: 'Empty space, row 1, column 1' }));
    expect(screen.getByText('1 of 4 pieces placed')).toBeTruthy();
  });

  it('deletes puzzle photos when a parent resets all progress', () => {
    savePhotos(addPhoto([], jpeg, 'x'));
    useAppStore.getState().resetAllProgress();
    expect(localStorage.getItem(PHOTOS_KEY)).toBeNull();
  });
});

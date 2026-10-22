import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { lightTheme } from '../../theme/theme';
import { ANIMAL_TOTAL, LETTER_TOTAL, NUMBER_TOTAL, WORD_TOTAL } from '../../services/progressStats';
import ParentSettings from './ParentSettings';

describe('Parent settings summary', () => {
  it('names the four learning groups and the reset control', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <MemoryRouter>
          <ParentSettings />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByLabelText(`Letters, 0 of ${LETTER_TOTAL}`)).toBeTruthy();
    expect(screen.getByLabelText(`Numbers, 0 of ${NUMBER_TOTAL}`)).toBeTruthy();
    expect(screen.getByLabelText(`Animals, 0 of ${ANIMAL_TOTAL}`)).toBeTruthy();
    expect(screen.getByLabelText(`Words, 0 of ${WORD_TOTAL}`)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reset all progress' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Read the privacy page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Preview voice' })).toBeTruthy();
  });
});

import { render, screen } from '@testing-library/react-native';
import HomeScreen from './HomeScreen';

describe('Home screen', () => {
  it('shows the welcome, continue action, and learning cards', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText(/I'm Pip/)).toBeTruthy();
    expect(screen.getByLabelText('Continue learning in Keyboard Explorer')).toBeTruthy();
    expect(screen.getByLabelText('Keyboard Explorer. Tap a key and hear a word')).toBeTruthy();
    expect(screen.getByLabelText('Alphabet World. All 26 letters. 0 of 26')).toBeTruthy();
    expect(screen.getByLabelText(/Daily Learning Challenge/)).toBeTruthy();
    expect(screen.getAllByText('0/26').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0/21').length).toBeGreaterThan(0);
  });
});

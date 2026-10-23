import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, settings: Record<string, unknown> = {}) {
  await page.addInitScript(() => {
    // Count the tones the music starts. Headless browsers cannot be listened to.
    const start = OscillatorNode.prototype.start;
    (window as unknown as { tones: number }).tones = 0;
    OscillatorNode.prototype.start = function (...args: Parameters<typeof start>) {
      (window as unknown as { tones: number }).tones += 1;
      return start.apply(this, args);
    };
  });
  await page.goto('/');
  await page.evaluate((extra) => {
    localStorage.clear();
    localStorage.setItem('kids-learning-settings', JSON.stringify({ speechEnabled: false, soundEnabled: false, volume: 0.7, speechRate: 0.9, theme: 'light', reducedMotion: false, selectedVoice: null, gameDifficulty: 'beginner', ...extra }));
  }, settings);
}

const music = (page: Page) => page.evaluate(() => document.documentElement.dataset.music);
const tones = (page: Page) => page.evaluate(() => (window as unknown as { tones: number }).tones);

test.describe('Background music', () => {
  test('plays in games and stories, not at home or where listening matters', async ({ page }) => {
    await open(page);
    await page.goto('/');
    await expect.poll(() => music(page)).toBe('off');
    await page.goto('/games');
    await expect.poll(() => music(page)).toBe('play');
    await page.getByRole('button', { name: 'Number Racer' }).click();
    await expect.poll(() => music(page)).toBe('play');
    await page.goto('/stories/thirsty-crow');
    await expect.poll(() => music(page)).toBe('calm');
    await page.goto('/games/rhythm');
    await expect.poll(() => music(page)).toBe('off');
    await page.goto('/settings');
    await expect.poll(() => music(page)).toBe('off');
  });

  test('really plays notes once the child taps', async ({ page }) => {
    await open(page);
    await page.goto('/games');
    await page.getByRole('button', { name: 'Number Racer' }).click();
    await expect.poll(() => tones(page), { timeout: 5000 }).toBeGreaterThan(5);
  });

  test('the parent switch and Volume 0 turn it off', async ({ page }) => {
    await open(page, { backgroundMusic: false });
    await page.goto('/games');
    await expect.poll(() => music(page)).toBe('off');
    await open(page, { volume: 0 });
    await page.goto('/games');
    await expect.poll(() => music(page)).toBe('off');
    await open(page);
    await page.goto('/settings');
    await expect(page.getByRole('switch', { name: 'Background music' }).or(page.getByRole('checkbox', { name: 'Background music' }))).toBeChecked();
  });
});

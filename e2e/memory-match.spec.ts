import { expect, test, type Page } from '@playwright/test';

/**
 * Clears a board like a child with a good memory: first turn over cards two at a
 * time to see every picture, then open each remembered pair.
 */
async function clearBoard(page: Page) {
  const cards = page.getByRole('button', { name: /^Card \d+,/ });
  const count = await cards.count();
  const names: string[] = [];
  for (let i = 0; i + 1 < count; i += 2) {
    await cards.nth(i).click();
    await cards.nth(i + 1).click();
    names[i] = /^Card \d+, (.+?)(, matched)?$/.exec((await cards.nth(i).getAttribute('aria-label'))!)![1];
    names[i + 1] = /^Card \d+, (.+?)(, matched)?$/.exec((await cards.nth(i + 1).getAttribute('aria-label'))!)![1];
    await page.clock.runFor(1100);
  }
  for (const name of new Set(names)) {
    const pair = names.flatMap((item, index) => (item === name ? [index] : []));
    if ((await cards.nth(pair[0]).getAttribute('aria-label'))!.endsWith('matched')) continue;
    await cards.nth(pair[0]).click();
    await cards.nth(pair[1]).click();
    await page.clock.runFor(100);
  }
}

test('Memory Match is endless: a cleared board deals the next one, and Finish reports the level', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('kids-learning-settings', JSON.stringify({ speechEnabled: false, soundEnabled: false, volume: 0.7, speechRate: 0.9, theme: 'light', reducedMotion: true, selectedVoice: null, gameDifficulty: 'beginner', backgroundMusic: false }));
  });
  await page.goto('/memory');
  await expect(page.getByTestId('endless-level')).toContainText('Level 1 · 6 cards');
  await page.getByRole('button', { name: /Animal Pairs/ }).click();
  await expect(page.getByRole('button', { name: /^Card \d+,/ })).toHaveCount(6);
  await clearBoard(page);
  await expect(page.getByTestId('board-cleared')).toBeVisible();
  await page.clock.runFor(3500);
  await expect(page.getByTestId('board-cleared')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Card \d+, face down$/ })).toHaveCount(6);
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByText(/You cleared 1 board and found 3 pairs\. You reached Level 1!/)).toBeVisible();
  expect(errors).toEqual([]);
});

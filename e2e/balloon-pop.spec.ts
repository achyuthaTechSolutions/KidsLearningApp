import { expect, test } from '@playwright/test';

test('Balloon Pop is endless: 3 clean targets go up a level, and Finish shows the level reached', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('kids-learning-settings', JSON.stringify({ speechEnabled: false, soundEnabled: false, volume: 0.7, speechRate: 0.9, theme: 'light', reducedMotion: false, selectedVoice: null, gameDifficulty: 'beginner', backgroundMusic: false }));
  });
  await page.goto('/balloons');
  await expect(page.getByTestId('endless-level')).toContainText('Level 1');
  await page.getByRole('button', { name: /Letter Balloons/ }).click();
  const sky = page.getByRole('group', { name: 'Balloon sky' });
  for (let pop = 0; pop < 9; pop += 1) {
    const target = /Pop the letter ([A-Z])!/.exec(await page.getByText(/^Pop the letter [A-Z]!$/).first().innerText())![1];
    const balloon = sky.getByRole('button', { name: `Balloon with letter ${target}` }).first();
    for (let i = 0; i < 40 && (await balloon.count()) === 0; i += 1) await page.clock.runFor(250);
    await balloon.focus();
    await page.keyboard.press('Enter');
    if (pop === 8) await expect(page.getByTestId('level-up')).toHaveText('Level up! Level 2');
  }
  await expect(page.getByTestId('game-level')).toHaveText('Level 2');
  await expect(page.getByLabel('9 balloons popped')).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByText('You popped 9 balloons and reached Level 2!')).toBeVisible();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kids-learning-progress') ?? '{}'));
  expect(progress.gameSkill.balloons).toBe(2);
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
const labels: Record<string, string> = { 'move forward': 'Move forward', 'turn left': 'Turn left', 'turn right': 'Turn right' };

async function openRobot(page: Page, difficulty: string) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.evaluate((level) => {
    localStorage.clear();
    localStorage.setItem('kids-learning-settings', JSON.stringify({ speechEnabled: false, soundEnabled: false, volume: 0, speechRate: 0.9, theme: 'light', reducedMotion: true, selectedVoice: null, gameDifficulty: level }));
  }, difficulty);
  await page.goto('/games/robot');
  return errors;
}

test.describe('Little Robot Adventure', () => {
  for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
    test(`every ${difficulty} level can be solved by following the hints`, async ({ page }) => {
      const errors = await openRobot(page, difficulty);
      for (let index = 0; index < 3; index += 1) {
        await page.getByRole('button', { name: new RegExp(`^Level ${index + 1}, `) }).click();
        for (let step = 0; step < 20; step += 1) {
          await page.getByRole('button', { name: 'Hint' }).click();
          const hint = (await page.getByTestId('robot-hint').innerText()).trim();
          if (hint === 'Your plan works. Press Go!') break;
          const next = /^Next, try (.+)\.$/.exec(hint);
          expect(next, `level ${index + 1}: unexpected hint "${hint}"`).not.toBeNull();
          await page.getByRole('button', { name: labels[next![1]], exact: true }).click();
        }
        await page.getByRole('button', { name: 'Go!' }).click();
        await expect(page.getByText('Hooray! The robot made it to the flag!').first()).toBeVisible({ timeout: 15_000 });
        await page.getByRole('button', { name: 'Levels', exact: true }).click();
        await expect(page.getByRole('button', { name: new RegExp(`^Level ${index + 1}, .*, finished`) })).toBeVisible();
      }
      expect(errors).toEqual([]);
    });
  }

  test('the hint is shown on screen and never crashes, even for a plan with extra steps', async ({ page }) => {
    const errors = await openRobot(page, 'beginner');
    await page.getByRole('button', { name: /^Level 1, Straight to the flag/ }).click();
    await page.getByRole('button', { name: 'Hint' }).click();
    await expect(page.getByTestId('robot-hint')).toHaveText('Next, try move forward.');
    for (let i = 0; i < 4; i += 1) await page.getByRole('button', { name: 'Move forward', exact: true }).click();
    await page.getByRole('button', { name: 'Hint' }).click();
    await expect(page.getByTestId('robot-hint')).toHaveText('Your plan works. Press Go!');
    // On a phone the hint sits below the buttons; it must scroll into view, not hide under the menu bar.
    await expect(page.getByTestId('robot-hint')).toBeInViewport({ ratio: 1 });
    expect(errors).toEqual([]);
  });

  test('a bump shows which command hit the rock', async ({ page }) => {
    const errors = await openRobot(page, 'intermediate');
    await page.getByRole('button', { name: /^Level 1, Around the rock/ }).click();
    for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: 'Move forward', exact: true }).click();
    await page.getByRole('button', { name: 'Go!' }).click();
    await expect(page.getByText('Bump! A rock is in the way. Look at command 2.').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('listitem', { name: '2. Move forward, bumped here' })).toBeVisible();
    await page.getByRole('button', { name: 'Hint' }).click();
    await expect(page.getByTestId('robot-hint')).toHaveText('Try changing command 2 to turn left.');
    expect(errors).toEqual([]);
  });
});

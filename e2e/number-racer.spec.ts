import { expect, test, type Page } from '@playwright/test';

async function openRacer(page: Page, difficulty = 'beginner') {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto('/');
  await page.evaluate((level) => {
    localStorage.clear();
    localStorage.setItem('kids-learning-settings', JSON.stringify({ speechEnabled: false, soundEnabled: false, volume: 0, speechRate: 0.9, theme: 'light', reducedMotion: false, selectedVoice: null, gameDifficulty: level }));
  }, difficulty);
  await page.goto('/games/racer');
  return errors;
}

/** Lets the gate drive down until the car reaches it and the result shows. */
async function driveToGate(page: Page) {
  const feedback = page.getByTestId('race-feedback');
  for (let i = 0; i < 60 && (await feedback.count()) === 0; i += 1) await page.clock.runFor(250);
  return feedback;
}

/** The right answer for a beginner gate, read from the screen: "Drive to 4", or a row of pictures to count. */
async function beginnerAnswer(page: Page): Promise<string> {
  const text = (await page.getByTestId('race-question').innerText()).trim();
  const find = /^Drive to (\d+)$/.exec(text);
  if (find) return find[1];
  const label = await page.getByRole('img', { name: /to count$/ }).getAttribute('aria-label');
  return /^(\d+)/.exec(label!)![1];
}

test.describe('Number Racer', () => {
  test('is listed with the games, levels up after 3 first tries, and carries on from the saved level', async ({ page }) => {
    const errors = await openRacer(page);
    await page.goto('/games');
    await page.getByRole('button', { name: 'Number Racer' }).click();
    await expect(page.getByTestId('endless-level')).toContainText('Level 1');
    await page.getByRole('button', { name: 'Start the race!' }).click();
    await expect(page.getByTestId('game-level')).toHaveText('Level 1');
    for (let gate = 0; gate < 5; gate += 1) {
      const answer = await beginnerAnswer(page);
      await page.getByRole('button', { name: new RegExp(`^Lane \\d: ${answer}$`) }).click();
      await expect(await driveToGate(page)).toContainText('Zoom!');
      if (gate === 2) await expect(page.getByTestId('level-up')).toHaveText('Level up! Level 2');
      await page.clock.runFor(3000);
    }
    await expect(page.getByTestId('game-level')).toHaveText('Level 2');
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page.getByText('You reached Level 2 and drove through 5 gates! 5 on the first try.')).toBeVisible();
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('kids-learning-progress') ?? '{}'));
    expect(progress.gameSkill.racer).toBe(2);
    expect(progress.gameLevels.racer).toEqual(['level-2']);
    await page.goto('/games/racer');
    await expect(page.getByTestId('endless-level')).toContainText('Level 2');
    expect(errors).toEqual([]);
  });

  test('a wrong lane is gentle: it shows the answer, keeps the question, and the right gate glows after two misses', async ({ page }) => {
    const errors = await openRacer(page);
    await page.getByRole('button', { name: 'Start the race!' }).click();
    const question = await page.getByTestId('race-question').innerText();
    const answer = await beginnerAnswer(page);
    for (let miss = 0; miss < 2; miss += 1) {
      const lanes = page.getByRole('button', { name: /^Lane \d: \d+$/ });
      for (let i = 0; i < 3; i += 1) {
        const label = (await lanes.nth(i).getAttribute('aria-label'))!;
        if (!label.endsWith(`: ${answer}`)) {
          await lanes.nth(i).click();
          break;
        }
      }
      await expect(await driveToGate(page)).toContainText(`Oops! The answer is ${answer}.`);
      await page.clock.runFor(3000);
      await expect(page.getByTestId('race-question')).toHaveText(question);
    }
    // After two misses the right gate glows, and it is the right answer.
    await expect(page.locator('[data-glow="true"]')).toHaveText(answer);
    expect(errors).toEqual([]);
  });

  test('arrow keys steer, and Pause stops the gate', async ({ page }) => {
    await openRacer(page);
    await page.getByRole('button', { name: 'Start the race!' }).click();
    const car = page.getByTestId('car');
    await expect(car).toHaveAttribute('data-lane', '1');
    await page.keyboard.press('ArrowLeft');
    await expect(car).toHaveAttribute('data-lane', '0');
    await page.keyboard.press('ArrowLeft');
    await expect(car).toHaveAttribute('data-lane', '0');
    await page.keyboard.press('3');
    await expect(car).toHaveAttribute('data-lane', '2');
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.clock.runFor(30_000);
    await expect(page.getByTestId('race-feedback')).toHaveCount(0);
    await page.getByRole('button', { name: 'Keep driving' }).first().click();
    await expect(await driveToGate(page)).toBeVisible();
  });
});

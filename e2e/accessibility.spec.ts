import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { activity, caption, next, openStory } from './helpers.ts';

/** Fails on serious or critical axe findings in Story Time, and prints them clearly. */
async function expectNoSeriousViolations(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  const summary = serious.flatMap((violation) => violation.nodes.slice(0, 3).map((node) => `${violation.id} (${violation.impact}): ${node.html.slice(0, 120)} :: ${(node.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 160)}`));
  expect(summary, `${where} has accessibility violations`).toEqual([]);
}

test.describe('Story Time accessibility', () => {
  // Entrance animations fade content in. Measured mid-fade, axe would report low contrast that
  // nobody sees at rest, so these scans use reduced motion, where everything is fully shown.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('library, story lines, activities, graph, and ending have no serious axe violations', async ({ page }) => {
    await page.goto('/stories');
    await expect(page.getByRole('article')).toHaveCount(5);
    await expectNoSeriousViolations(page, 'Story library');

    await openStory(page, 'thirsty-crow');
    await expectNoSeriousViolations(page, 'Story line');
    await next(page, 5);
    await expect(activity(page)).toBeVisible();
    await expectNoSeriousViolations(page, 'Question activity');
    await activity(page).getByRole('button', { name: /^No, the water is too low/ }).click();
    await next(page, 2);
    await next(page, 2);
    await expectNoSeriousViolations(page, 'Pebble pot');

    await openStory(page, 'cooperative-doves');
    await next(page, 5);
    await expectNoSeriousViolations(page, 'Bar graph');

    await openStory(page, 'thirsty-crow', 'te');
    await expectNoSeriousViolations(page, 'Telugu story line');
    await expect(page.locator('[data-testid="caption"][lang="te"]')).toBeVisible();
  });

  test('a story can be read and answered with the keyboard alone', async ({ page }) => {
    await openStory(page, 'thirsty-crow');
    const nextButton = page.getByRole('button', { name: 'Next', exact: true });
    await nextButton.focus();
    await page.keyboard.press('Enter');
    await expect(caption(page)).toHaveText('Caw! I am so thirsty. Where can I find water?');
    for (let i = 0; i < 4; i += 1) {
      await page.getByRole('button', { name: 'Next', exact: true }).first().focus();
      await page.keyboard.press('Enter');
    }
    const answer = activity(page).getByRole('button', { name: /^No, the water is too low/ });
    await answer.focus();
    await expect(answer).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(activity(page).getByText('Yes! Well done!')).toBeVisible();
  });

  test('reduced motion stops character animations', async ({ page }) => {
    await openStory(page, 'thirsty-crow');
    const duration = await page.locator('[data-expression]').first().locator('div').first().evaluate((node) => getComputedStyle(node).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
  });
});

test.describe('Story Time motion', () => {
  test('the parent Reduce motion setting stops animations too', async ({ page }) => {
    await openStory(page, 'thirsty-crow');
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('kids-learning-settings')!);
      localStorage.setItem('kids-learning-settings', JSON.stringify({ ...settings, reducedMotion: true }));
    });
    await page.reload();
    const duration = await page.locator('[data-expression]').first().locator('div').first().evaluate((node) => getComputedStyle(node).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
  });

  test('characters do animate when reduced motion is off', async ({ page }) => {
    await openStory(page, 'thirsty-crow');
    const duration = await page.locator('[data-expression]').first().locator('div').first().evaluate((node) => getComputedStyle(node).animationDuration);
    expect(parseFloat(duration)).toBeGreaterThan(0.5);
  });
});

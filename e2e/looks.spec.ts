import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function useLook(page: Page, look: string) {
  // Axe reads colours, so screens must not be part-way through fading in.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Only on first load, so a look picked in Parent Settings survives a reload.
  await page.addInitScript((value) => {
    if (localStorage.getItem('kids-learning-settings')) return;
    localStorage.setItem('kids-learning-settings', JSON.stringify({ appLook: value, speechEnabled: false, backgroundMusic: false }));
  }, look);
}

async function expectAccessible(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  const summary = serious.flatMap((violation) => violation.nodes.slice(0, 3).map((node) => `${violation.id}: ${node.html.slice(0, 120)} :: ${(node.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 160)}`));
  expect(summary, `${where} has accessibility violations`).toEqual([]);
}

async function expectNoSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
}

for (const look of ['garden', 'blocks', 'map']) {
  test(`${look}: Home and Games fit the screen, pass axe, and open a game`, async ({ page }) => {
    await useLook(page, look);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-look', look);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSideScroll(page);
    await expectAccessible(page, `${look} Home`);

    await page.locator('main').getByRole('button', { name: /^Games(\.|$)|^Game Island$/ }).first().click();
    await expect(page).toHaveURL(/\/games$/);
    await expectNoSideScroll(page);
    await expectAccessible(page, `${look} Games`);

    await page.getByRole('button', { name: /^Memory Match|^Memory\./ }).first().click();
    await expect(page).toHaveURL(/\/memory$/);
  });
}

test('Bright Blocks: a tap on the lock only shows a hint; press and hold opens Parent Settings', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The bottom menu is on phones only');
  await useLook(page, 'blocks');
  await page.goto('/');
  const lock = page.getByRole('button', { name: 'Grown-ups (press and hold to open)' });
  await lock.click();
  await expect(page.getByRole('status').filter({ hasText: 'Grown-ups: press and hold' })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  const box = (await lock.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1200);
  await page.mouse.up();
  await expect(page).toHaveURL(/\/settings$/);
});

test('the look can be changed in Parent Settings and Classic comes back', async ({ page }) => {
  await useLook(page, 'map');
  await page.goto('/settings');
  await page.getByRole('radio', { name: /^Classic/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-look', 'classic');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ready to explore?' })).toBeVisible();
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests for Story Time against the production build (`vite preview`).
 * Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to use an already-installed Chromium;
 * otherwise run `npx playwright install chromium` once.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: process.env.CI ? 1 : 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'android-phone', use: { ...devices['Pixel 7'] } },
  ],
});

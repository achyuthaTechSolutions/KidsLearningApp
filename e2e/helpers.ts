import { expect, type Page } from '@playwright/test';

/**
 * Opens a story from the start, with narration off so tests never wait on speech.
 * Stories move on by themselves, so by default the helper presses Pause and the test
 * steps with Next. Pass `autoplay` to leave it playing (use `page.clock` to fast-forward).
 */
export async function openStory(page: Page, storyId: string, lang: 'en' | 'te' | 'hi' = 'en', options: { mode?: 'puzzle' | 'story'; autoplay?: boolean } = {}) {
  await page.goto('/');
  await page.evaluate(([language, mode]) => {
    localStorage.clear();
    localStorage.setItem('kids-learning-settings', JSON.stringify({
      speechEnabled: true, soundEnabled: false, volume: 0.7, speechRate: 0.9, theme: 'light', reducedMotion: false,
      selectedVoice: null, gameDifficulty: 'beginner', storyLanguage: language, storyNarration: false, storyCaptions: true, storyMode: mode,
    }));
  }, [lang, options.mode ?? 'puzzle']);
  await page.goto(`/stories/${storyId}`);
  await expect(page.getByTestId('caption')).toBeVisible();
  if (!options.autoplay) await page.getByRole('button', { name: /^(Pause|ఆపు|रुको)$/ }).click();
}

export const caption = (page: Page) => page.getByTestId('caption');
export const activity = (page: Page) => page.getByTestId('activity');

/** Presses the story's Next button (caption, activity, or continue). */
export async function next(page: Page, times = 1) {
  for (let i = 0; i < times; i += 1) await page.getByRole('button', { name: 'Next', exact: true }).first().click();
}

/** Reads the saved Story Time data from this browser. */
export function storedStories(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kids-learning-stories') ?? '{}'));
}

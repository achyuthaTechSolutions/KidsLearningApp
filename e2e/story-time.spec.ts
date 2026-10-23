import { expect, test } from '@playwright/test';
import { activity, caption, next, openStory, storedStories } from './helpers.ts';

test.describe('Story library', () => {
  test('lists the five stories, filters by age, and opens a story', async ({ page }) => {
    await page.goto('/stories');
    await expect(page.getByRole('article')).toHaveCount(5);
    await page.getByRole('button', { name: 'Ages 7–9' }).click();
    await expect(page.getByRole('article')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Kalu and the Thirsty Crow' })).toHaveCount(0);
    await page.getByRole('button', { name: 'All ages' }).click();
    await page.getByRole('button', { name: /Start the story: Kalu/ }).click();
    await expect(caption(page)).toHaveText('It was a hot summer day. The sun was shining bright.');
  });
});

test.describe('Kalu and the Thirsty Crow', () => {
  test('plays to the end with hints, a demonstration, and one completion record', async ({ page }) => {
    await openStory(page, 'thirsty-crow');
    await next(page, 3);
    await expect(caption(page)).toHaveText('Kalu flew and flew. At last, he saw a pot under a tree.');
    await next(page, 2);

    // A wrong answer shows the hint; the right one shows the explanation.
    await activity(page).getByRole('button', { name: /^Yes, easily/ }).click();
    await expect(activity(page).getByText('Not quite. Try again!')).toBeVisible();
    await expect(activity(page).getByText('Look at the pot. Is the water near the top or near the bottom?')).toBeVisible();
    await activity(page).getByRole('button', { name: /^No, the water is too low/ }).click();
    await expect(activity(page).getByText('Yes! Well done!')).toBeVisible();
    await next(page, 2);

    // Pebble pot: two pebbles, a prediction with two misses, then "Show me".
    await next(page, 2);
    const drop = activity(page).getByRole('button', { name: /^Drop a pebble/ }).first();
    await drop.click();
    await drop.click();
    await expect(activity(page).getByText('Pebbles in the pot: 2')).toBeVisible();
    await expect(activity(page).getByRole('heading', { name: /How many more pebbles/ })).toBeVisible();
    await activity(page).getByRole('button', { name: '1', exact: true }).click();
    await expect(activity(page).getByRole('button', { name: 'Show me' })).toHaveCount(0);
    await activity(page).getByRole('button', { name: '3', exact: true }).click();
    await activity(page).getByRole('button', { name: 'Show me' }).click();
    await activity(page).getByRole('button', { name: '2, correct' }).click();
    await activity(page).getByRole('button', { name: /^Drop a pebble/ }).first().click();
    await activity(page).getByRole('button', { name: /^Drop a pebble/ }).first().click();
    await expect(activity(page).getByRole('heading', { name: 'The water is high enough. Kalu can drink!' })).toBeVisible();
    await next(page, 2);

    // Count, compare, and explain.
    await next(page, 2);
    await activity(page).getByRole('button', { name: '4', exact: true }).click();
    await next(page, 2);
    await next(page, 1);
    await activity(page).getByRole('button', { name: /friend \(6\)/ }).click();
    await next(page, 2);
    await next(page, 1);
    await activity(page).getByRole('button', { name: /pebbles pushed/ }).click();
    await next(page, 2);
    await next(page, 2);

    await expect(page.getByRole('heading', { name: 'The End' })).toBeVisible();
    await expect(page.getByTestId('moral')).toHaveText('When something is hard, keep trying and think of a new way.');
    const saved = await storedStories(page);
    expect(saved.stories['thirsty-crow'].completedRuns).toHaveLength(1);
    expect(saved.events.map((event: { activityId: string; clean: boolean }) => [event.activityId, event.clean])).toEqual([
      ['can-reach', false], ['drop-pebbles', false], ['count-pebbles', true], ['who-more', true], ['why-rise', true],
    ]);

    await page.goto('/stories');
    await expect(page.getByRole('article').filter({ hasText: 'Kalu and the Thirsty Crow' }).getByText('Finished')).toBeVisible();
  });

  test('resumes on the same line after the app is reopened', async ({ page }) => {
    await openStory(page, 'thirsty-crow');
    await next(page, 3);
    await expect(caption(page)).toHaveText('Kalu flew and flew. At last, he saw a pot under a tree.');
    await page.reload();
    await expect(caption(page)).toHaveText('Kalu flew and flew. At last, he saw a pot under a tree.');
    await page.goto('/stories');
    await page.getByRole('button', { name: 'Continue' }).first().click();
    await expect(caption(page)).toHaveText('Kalu flew and flew. At last, he saw a pot under a tree.');
  });

  test('keeps the story position and the activity in progress when the language changes', async ({ page }) => {
    await openStory(page, 'thirsty-crow');
    await next(page, 3);
    await page.getByRole('button', { name: 'తెలుగు' }).click();
    await expect(caption(page)).toHaveText('కాలూ ఎగిరి ఎగిరి వెళ్లాడు. చివరికి ఒక చెట్టు కింద ఒక కుండ కనిపించింది.');
    await page.getByRole('button', { name: 'हिन्दी' }).click();
    await expect(caption(page)).toHaveText('कालू उड़ता रहा, उड़ता रहा। आख़िर में उसे एक पेड़ के नीचे एक घड़ा दिखा।');
    await page.getByRole('button', { name: 'English' }).click();

    await next(page, 2);
    await activity(page).getByRole('button', { name: /^No, the water is too low/ }).click();
    await next(page, 2);
    await next(page, 2);
    await activity(page).getByRole('button', { name: /^Drop a pebble/ }).first().click();
    await page.getByRole('button', { name: 'తెలుగు' }).click();
    await expect(activity(page).getByText('కుండలో గులకరాళ్లు: 1')).toBeVisible();
    await page.getByRole('button', { name: 'English' }).click();
    await expect(activity(page).getByText('Pebbles in the pot: 1')).toBeVisible();
  });
});

test.describe('Branching', () => {
  test('the rabbit can try hiding first, then rejoins the plan', async ({ page }) => {
    await openStory(page, 'clever-rabbit');
    await next(page, 4);
    await activity(page).getByRole('button', { name: '5', exact: true }).click();
    await next(page, 2);
    await next(page, 2);
    await expect(page.getByRole('heading', { name: 'What should happen next?' })).toBeVisible();
    await page.getByRole('button', { name: /Run away and hide/ }).click();
    await expect(caption(page)).toHaveText('If I hide, the lion will still scare my friends. I need a better plan!');
    await next(page, 2);
    await expect(caption(page)).toHaveText('Why are you so late?');
    const saved = await storedStories(page);
    expect(saved.stories['clever-rabbit'].playback.choices).toEqual({ 'rabbit-turn': 'hide' });
  });

  test('the other choice goes straight to the plan', async ({ page }) => {
    await openStory(page, 'clever-rabbit');
    await next(page, 4);
    await activity(page).getByRole('button', { name: '5', exact: true }).click();
    await next(page, 2);
    await next(page, 2);
    await page.getByRole('button', { name: /Tell the lion about another lion/ }).click();
    await expect(caption(page)).toHaveText('Why are you so late?');
  });
});

test.describe('Bar graph lesson', () => {
  test('builds bars only to the real counts and answers questions about them', async ({ page }) => {
    await openStory(page, 'cooperative-doves');
    await next(page, 4);
    await next(page, 1);
    const graph = activity(page);
    for (const [label, count] of [['White doves', 6], ['Blue doves', 3], ['Dark doves', 4]] as const) {
      const add = graph.getByRole('button', { name: new RegExp(`^Add one to ${label}`) });
      for (let i = 0; i < count; i += 1) await add.click();
      await expect(add).toBeDisabled();
    }
    await expect(graph.getByRole('figure')).toHaveAttribute('aria-label', 'Bar graph. White doves: 6, Blue doves: 3, Dark doves: 4');
    await expect(graph.getByRole('heading', { name: 'Which group found the most grains?' })).toBeVisible();
    await graph.getByRole('button', { name: /^Dark doves$/ }).click();
    await expect(graph.getByText('Not quite. Try again!')).toBeVisible();
    await graph.getByRole('button', { name: /^White doves$/ }).click();
    await expect(graph.getByRole('heading', { name: 'Which group found the fewest grains?' })).toBeVisible();
    await graph.getByRole('button', { name: /^Blue doves$/ }).click();
    await expect(graph.getByRole('heading', { name: /How many more grains/ })).toBeVisible();
    await graph.getByRole('button', { name: '3', exact: true }).click();
    await expect(graph.getByText('Yes! Well done!')).toBeVisible();
    await next(page, 1);
    const saved = await storedStories(page);
    expect(saved.events).toEqual([expect.objectContaining({ activityId: 'grain-graph', solved: true, clean: false })]);
  });
});

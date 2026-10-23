import { expect, test } from '@playwright/test';
import { activity, caption, next, openStory, storedStories } from './helpers.ts';

test.describe('Story library', () => {
  test('lists the five stories, filters by age, and opens a story', async ({ page }) => {
    await page.goto('/stories');
    await expect(page.getByRole('article')).toHaveCount(5);
    await page.getByRole('button', { name: 'Ages 7–8' }).click();
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

test.describe('Languages', () => {
  test('Telugu and Hindi render in the bundled Noto fonts', async ({ page }) => {
    for (const [lang, family, sample] of [['te', 'Noto Sans Telugu', 'కాలూ'], ['hi', 'Noto Sans Devanagari', 'कालू']] as const) {
      await openStory(page, 'thirsty-crow', lang);
      await expect(page.locator(`[data-testid="caption"][lang="${lang}"]`)).toBeVisible();
      // The caption is bold, so the bold face must have loaded and be in the caption's font stack.
      const loaded = await page.evaluate(async ([fontFamily, text]) => {
        await document.fonts.ready;
        const caption = document.querySelector('[data-testid="caption"]')!;
        const style = getComputedStyle(caption);
        const bundled = [...document.fonts].some((face) => face.family.replace(/"/g, '') === fontFamily && face.weight === style.fontWeight && face.status === 'loaded');
        return bundled && style.fontFamily.includes(fontFamily) && document.fonts.check(`${style.fontWeight} 20px "${fontFamily}"`, text);
      }, [family, sample]);
      expect(loaded, `${family} loaded`).toBe(true);
    }
  });

  test('without a Telugu voice, the story says so and keeps showing the words', async ({ page }) => {
    // Headless Chromium has no speech voices, like a phone without a Telugu voice pack.
    await openStory(page, 'thirsty-crow', 'te');
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('kids-learning-settings')!);
      localStorage.setItem('kids-learning-settings', JSON.stringify({ ...settings, storyNarration: true }));
    });
    await page.reload();
    await expect(page.getByText('ఈ పరికరంలో ఈ భాషకు గొంతు లేదు, అందుకే కథ మాటలను చూపిస్తుంది.')).toBeVisible();
    await expect(caption(page)).toHaveText('అది ఒక వేడి వేసవి రోజు. సూర్యుడు బాగా ప్రకాశిస్తున్నాడు.');
    await page.getByRole('button', { name: 'తర్వాత', exact: true }).click();
    await expect(caption(page)).not.toHaveText('అది ఒక వేడి వేసవి రోజు. సూర్యుడు బాగా ప్రకాశిస్తున్నాడు.');
  });
});

test.describe('Story and Puzzle modes', () => {
  test('Puzzle mode turns the pages by itself, stops at the puzzle, and carries on once it is solved', async ({ page }) => {
    await page.clock.install();
    await openStory(page, 'thirsty-crow', 'en', { mode: 'puzzle', autoplay: true });
    await expect(page.getByTestId('mode-help')).toHaveText('The story stops for each puzzle, then carries on.');
    await expect(caption(page)).toHaveText('It was a hot summer day. The sun was shining bright.');
    // No Next presses: the first scene's lines turn by themselves, then the story waits at the puzzle.
    for (let i = 0; i < 20 && !(await activity(page).isVisible()); i += 1) await page.clock.runFor(3000);
    await expect(activity(page).getByRole('heading', { name: /Can Kalu’s beak reach it/ })).toBeVisible();
    await page.clock.runFor(30_000);
    await expect(activity(page)).toBeVisible();
    await activity(page).getByRole('button', { name: /^No, the water is too low/ }).click();
    await expect(activity(page).getByText('Yes! Well done!')).toBeVisible();
    await page.clock.runFor(10_000);
    await expect(activity(page)).toHaveCount(0);
    await expect(caption(page)).toBeVisible();
    const saved = await storedStories(page);
    expect(saved.events.map((event: { activityId: string }) => event.activityId)).toEqual(['can-reach']);
  });

  test('Story mode plays to the end with no presses, passing the puzzles and taking the main path', async ({ page }) => {
    await page.clock.install();
    await openStory(page, 'clever-rabbit', 'en', { mode: 'story', autoplay: true });
    await expect(page.getByTestId('mode-help')).toHaveText('The story plays all the way to the end.');
    const end = page.getByRole('heading', { name: 'The End' });
    for (let i = 0; i < 120 && !(await end.isVisible()); i += 1) {
      await expect(activity(page)).toHaveCount(0);
      await page.clock.runFor(3000);
    }
    await expect(end).toBeVisible();
    const saved = await storedStories(page);
    expect(saved.stories['clever-rabbit'].completedRuns).toHaveLength(1);
    expect(saved.stories['clever-rabbit'].playback.choices).toEqual({ 'rabbit-turn': 'trick' });
    // Passing a puzzle is not learning: nothing is recorded as practised.
    expect(saved.events).toEqual([]);
  });

  test('Pause stops the pages turning, and the choice of mode is remembered', async ({ page }) => {
    await page.clock.install();
    await openStory(page, 'thirsty-crow', 'en', { mode: 'puzzle', autoplay: true });
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.clock.runFor(60_000);
    await expect(caption(page)).toHaveText('It was a hot summer day. The sun was shining bright.');
    await page.getByRole('button', { name: /Story mode/ }).click();
    await page.reload();
    await expect(page.getByTestId('mode-help')).toHaveText('The story plays all the way to the end.');
  });

  test('without a Telugu voice, lines still turn by themselves after time to read', async ({ page }) => {
    await page.clock.install();
    await openStory(page, 'thirsty-crow', 'te', { autoplay: true });
    await page.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('kids-learning-settings')!);
      localStorage.setItem('kids-learning-settings', JSON.stringify({ ...settings, storyNarration: true }));
    });
    await page.reload();
    const first = 'అది ఒక వేడి వేసవి రోజు. సూర్యుడు బాగా ప్రకాశిస్తున్నాడు.';
    await expect(caption(page)).toHaveText(first);
    await expect(page.getByText('ఈ పరికరంలో ఈ భాషకు గొంతు లేదు, అందుకే కథ మాటలను చూపిస్తుంది.')).toBeVisible();
    // Not flashed past: still on screen after 2 seconds, turned after reading time.
    await page.clock.runFor(2000);
    await expect(caption(page)).toHaveText(first);
    await page.clock.runFor(8000);
    await expect(caption(page)).not.toHaveText(first);
  });
});

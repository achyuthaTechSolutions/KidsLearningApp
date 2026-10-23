import { illustrationFor } from '../../../data/illustrations';
import { storyAssets } from '../assets';
import type { LearningStage } from '../engine/stages';
import type { BackdropId, StoryManifest } from '../engine/types';
import { errorsOf, validateStory, type ValidationContext } from '../engine/validate';
import { characterIds } from './characters';
import { cleverRabbit } from './cleverRabbit';
import { cooperativeDoves } from './cooperativeDoves';
import { lionMouse } from './lionMouse';
import { monkeyCrocodile } from './monkeyCrocodile';
import { thirstyCrow } from './thirstyCrow';

export const backdropIds: BackdropId[] = ['dry-field', 'forest', 'forest-well', 'river', 'tree-river', 'meadow', 'sky'];

export const storyValidationContext: ValidationContext = {
  characters: characterIds,
  backdrops: backdropIds,
  hasPicture: (emoji) => Boolean(illustrationFor(emoji)),
  hasAudio: (id) => storyAssets.hasAudio(id),
};

/** Every story written so far, in reading order, including drafts. */
export const allStories: StoryManifest[] = [thirstyCrow, cleverRabbit, lionMouse, monkeyCrocodile, cooperativeDoves];

/**
 * Stories children can open: published and free of validation errors. A story
 * with an error stays hidden rather than showing a broken scene.
 */
export function publishedStories(stories: StoryManifest[] = allStories): StoryManifest[] {
  return stories.filter((story) => {
    if (story.status !== 'published') return false;
    const errors = errorsOf(validateStory(story, storyValidationContext));
    if (errors.length > 0 && import.meta.env.DEV) {
      // Tell story authors why a story is hidden. Children only see the stories that pass.
      console.warn(`Story "${story.id}" is hidden until these are fixed:`, errors);
    }
    return errors.length === 0;
  });
}

export function storyById(id: string): StoryManifest | undefined {
  return publishedStories().find((story) => story.id === id);
}

/** The library's age filter: a learning stage, or every story. */
export type AgeFilter = LearningStage | 'all';

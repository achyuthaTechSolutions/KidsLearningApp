import { describe, expect, it } from 'vitest';
import { assetRegistry, narrationId, storyAssets } from '../assets';
import { errorsOf, validateStory } from '../engine/validate';
import { allTextEntries } from './inventory';
import { assetManifestCsv, assetProvenance, assetSlots } from './assetManifest';
import { allStories, storyValidationContext } from './library';

describe('Story asset registry', () => {
  const registry = assetRegistry(
    { '../../assets/stories/art/character.kalu.webp': '/a/kalu.webp', '../../assets/stories/art/backdrop.river.svg': '/a/river.svg' },
    { '../../assets/stories/narration/te/thirsty-crow/s1/l2.mp3': '/a/l2.mp3', '../../assets/stories/narration/hi/ui.whatNext.m4a': '/a/what.m4a' },
  );

  it('finds art and narration by file name, whatever the format', () => {
    expect(registry.art('character.kalu')).toBe('/a/kalu.webp');
    expect(registry.art('backdrop.river')).toBe('/a/river.svg');
    expect(registry.art('character.lion')).toBeUndefined();
    expect(registry.narrationUrl('te/thirsty-crow/s1/l2')).toBe('/a/l2.mp3');
    expect(registry.narrationUrl('hi/ui.whatNext')).toBe('/a/what.m4a');
    expect(registry.narrationUrl('en/thirsty-crow/s1/l2')).toBeUndefined();
  });

  it('uses a narration id the story names, or the text key by convention', () => {
    expect(narrationId('te', 'thirsty-crow/s1/l2')).toBe('te/thirsty-crow/s1/l2');
    expect(narrationId('te', 'thirsty-crow/s1/l2', { te: 'te/shared/caw' })).toBe('te/shared/caw');
    expect(narrationId('hi', 'thirsty-crow/s1/l2', { te: 'te/shared/caw' })).toBe('hi/thirsty-crow/s1/l2');
  });

  it('blocks a story that names a recording that is not bundled', () => {
    const story = structuredClone(allStories[0]);
    const scene = story.scenes[0];
    scene.lines[0] = { ...scene.lines[0], audio: { te: 'te/not-recorded' } };
    expect(errorsOf(validateStory(story, storyValidationContext)).map((issue) => issue.code)).toEqual(['missing-asset']);
  });

  it('names narration files with the same keys as the review sheet', () => {
    const textKeys = new Set(allTextEntries().map((entry) => entry.key));
    for (const slot of assetSlots().filter((item) => item.kind === 'narration')) {
      expect(textKeys.has(slot.assetId.slice(slot.assetId.indexOf('/') + 1)), slot.assetId).toBe(true);
    }
  });

  it('has provenance for every bundled replacement file', () => {
    for (const id of [...storyAssets.artIds(), ...storyAssets.narrationIds()]) expect(assetProvenance[id], id).toBeDefined();
    expect(assetSlots().filter((slot) => slot.provenance === 'MISSING')).toEqual([]);
  });

  it('keeps the asset manifest in step with the stories', async () => {
    await expect(assetManifestCsv(assetSlots())).toMatchFileSnapshot('../../../../docs/stories/asset-manifest.csv');
  });
});

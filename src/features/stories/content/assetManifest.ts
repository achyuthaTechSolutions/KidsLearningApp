import { emojiKey } from '../../../data/illustrations';
import { narrationId, storyAssets } from '../assets';
import { LANGUAGES, type Lang, type StoryManifest } from '../engine/types';
import { characters } from './characters';
import { allStories } from './library';

/**
 * Where each bundled replacement file came from. Every file under
 * `src/assets/stories/` needs an entry here before it can ship; a test enforces it.
 */
export const assetProvenance: Record<string, { source: string; license: string }> = {};

export interface AssetSlot {
  storyId: string;
  sceneId: string;
  assetId: string;
  kind: 'backdrop' | 'character' | 'prop' | 'narration';
  language: Lang | '';
  /** What is used today. */
  status: 'bundled' | 'development art' | 'device voice or text';
  /** Bundled format, or the formats a replacement may use. */
  format: string;
  provenance: string;
}

const ART_FORMATS = 'svg, png, or webp';
const AUDIO_FORMATS = 'mp3, m4a, or ogg';

function artSlot(storyId: string, sceneId: string, kind: 'backdrop' | 'character', assetId: string, fallback: string): AssetSlot {
  const url = storyAssets.art(assetId);
  return url
    ? { storyId, sceneId, assetId, kind, language: '', status: 'bundled', format: url.slice(url.lastIndexOf('.') + 1), provenance: provenanceOf(assetId) }
    : { storyId, sceneId, assetId, kind, language: '', status: 'development art', format: ART_FORMATS, provenance: fallback };
}

function narrationSlot(storyId: string, sceneId: string, lang: Lang, textKey: string, named?: Partial<Record<Lang, string>>): AssetSlot {
  const assetId = narrationId(lang, textKey, named);
  const url = storyAssets.narrationUrl(assetId);
  return url
    ? { storyId, sceneId, assetId, kind: 'narration', language: lang, status: 'bundled', format: url.slice(url.lastIndexOf('.') + 1), provenance: provenanceOf(assetId) }
    : { storyId, sceneId, assetId, kind: 'narration', language: lang, status: 'device voice or text', format: AUDIO_FORMATS, provenance: 'Placeholder: device text-to-speech, or text only' };
}

const provenanceOf = (assetId: string) => {
  const entry = assetProvenance[assetId];
  return entry ? `${entry.source} (${entry.license})` : 'MISSING';
};

/** Every art and narration slot a story uses, scene by scene. Shared text is listed under `shared`. */
export function assetSlots(stories: StoryManifest[] = allStories): AssetSlot[] {
  const slots: AssetSlot[] = [];
  for (const story of stories) {
    for (const scene of story.scenes) {
      slots.push(artSlot(story.id, scene.id, 'backdrop', `backdrop.${scene.backdrop}`, 'Development: SVG drawn in code (player/Stage.tsx), original to this app'));
      for (const member of scene.characters) {
        slots.push(artSlot(story.id, scene.id, 'character', `character.${member.id}`, `Development: Fluent Emoji ${emojiKey(characters[member.id].emoji)} (MIT, Microsoft)`));
      }
      for (const prop of scene.props ?? []) {
        slots.push({ storyId: story.id, sceneId: scene.id, assetId: `prop.${emojiKey(prop.emoji)}`, kind: 'prop', language: '', status: 'development art', format: 'svg', provenance: 'Fluent Emoji (MIT, Microsoft), replaced through src/assets/illustrations' });
      }
      for (const lang of LANGUAGES) {
        for (const line of scene.lines) slots.push(narrationSlot(story.id, scene.id, lang, `${story.id}/${scene.id}/${line.id}`, line.audio));
        if (scene.activity) slots.push(narrationSlot(story.id, scene.id, lang, `${story.id}/${scene.id}/${scene.activity.id}.prompt`));
        if (scene.moral) slots.push(narrationSlot(story.id, scene.id, lang, `${story.id}/${scene.id}.moral`));
      }
    }
  }
  for (const lang of LANGUAGES) slots.push(narrationSlot('shared', '', lang, 'ui.whatNext'));
  return slots;
}

/** One row per distinct slot, as CSV. A backdrop used in three scenes appears three times, once per scene. */
export function assetManifestCsv(slots: AssetSlot[]): string {
  const header = ['story_id', 'scene_id', 'asset_id', 'kind', 'language', 'status', 'format', 'provenance'];
  const seen = new Set<string>();
  const rows = slots.filter((slot) => {
    const key = `${slot.storyId}|${slot.sceneId}|${slot.assetId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((slot) => [slot.storyId, slot.sceneId, slot.assetId, slot.kind, slot.language, slot.status, slot.format, slot.provenance]);
  const cell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  return `${[header, ...rows].map((row) => row.map(cell).join(',')).join('\n')}\n`;
}

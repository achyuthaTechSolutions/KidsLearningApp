import type { BackdropId, CharacterId, Lang } from './engine/types';

/*
 * Story Time assets found by file name, so artwork and recorded narration can be
 * added without touching story data or player code. See docs/stories/ASSETS.md.
 *
 *   Art:        src/assets/stories/art/character.<characterId>.<svg|png|webp>
 *               src/assets/stories/art/backdrop.<backdropId>.<svg|png|webp>
 *   Narration:  src/assets/stories/narration/<lang>/<text key>.<mp3|m4a|ogg>
 *
 * The text key is the key on the review sheet, for example
 * `thirsty-crow/s1/l2`, `thirsty-crow/s2/can-reach.prompt`, or `ui.whatNext`.
 * No files are bundled yet, so every slot falls back to the development art and
 * to device speech (or text only).
 */

const artFiles = import.meta.glob('../../assets/stories/art/*.{svg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const narrationFiles = import.meta.glob('../../assets/stories/narration/**/*.{mp3,m4a,ogg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const withoutExtension = (path: string) => path.slice(0, path.lastIndexOf('.'));

/** Asset id to URL. Art ids look like `character.kalu`; narration ids like `te/thirsty-crow/s1/l2`. */
export function assetRegistry(art: Record<string, string>, narration: Record<string, string>) {
  const artById = new Map(Object.entries(art).map(([path, url]) => [withoutExtension(path.slice(path.lastIndexOf('/') + 1)), url]));
  const narrationById = new Map(Object.entries(narration).map(([path, url]) => [withoutExtension(path.slice(path.indexOf('/narration/') + '/narration/'.length)), url]));
  return {
    art: (id: string) => artById.get(id),
    /** Narration id such as `te/thirsty-crow/s1/l2`. */
    narrationUrl: (id: string) => narrationById.get(id),
    hasAudio: (id: string) => narrationById.has(id),
    artIds: () => [...artById.keys()].sort(),
    narrationIds: () => [...narrationById.keys()].sort(),
  };
}

export const storyAssets = assetRegistry(artFiles, narrationFiles);

export const characterArt = (id: CharacterId) => storyAssets.art(`character.${id}`);
export const backdropArt = (id: BackdropId) => storyAssets.art(`backdrop.${id}`);

/** The narration id for some text: an id the story names, or `<lang>/<text key>` by convention. */
export const narrationId = (lang: Lang, textKey: string, named?: Partial<Record<Lang, string>>) => named?.[lang] ?? `${lang}/${textKey}`;

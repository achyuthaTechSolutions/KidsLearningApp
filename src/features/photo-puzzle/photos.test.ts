import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_FILE_BYTES, MAX_NAME_LENGTH, MAX_PHOTOS, PHOTOS_KEY, PhotoError,
  addPhoto, centerSquare, checkFile, cleanName, clearPhotos, loadPhotos, savePhotos, type SavedPhoto,
} from './photos';

const jpeg = 'data:image/jpeg;base64,/9j/4AAQ';

function errorKind(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    return error instanceof PhotoError ? error.kind : 'other';
  }
  return undefined;
}

beforeEach(() => localStorage.clear());

describe('Picking a photo', () => {
  it('accepts pictures and refuses other files or huge ones', () => {
    expect(errorKind(() => checkFile({ type: 'image/jpeg', size: 2_000_000 }))).toBeUndefined();
    expect(errorKind(() => checkFile({ type: 'image/png', size: 10 }))).toBeUndefined();
    expect(errorKind(() => checkFile({ type: 'application/pdf', size: 10 }))).toBe('not-image');
    expect(errorKind(() => checkFile({ type: 'image/jpeg', size: MAX_FILE_BYTES + 1 }))).toBe('too-big');
  });

  it('crops the centred square of any shape', () => {
    expect(centerSquare(4000, 3000)).toEqual({ sx: 500, sy: 0, size: 3000 });
    expect(centerSquare(1080, 1920)).toEqual({ sx: 0, sy: 420, size: 1080 });
    expect(centerSquare(600, 600)).toEqual({ sx: 0, sy: 0, size: 600 });
  });

  it('tidies names and gives a default', () => {
    expect(cleanName('  Grandma   and  me ', 'Photo 1')).toBe('Grandma and me');
    expect(cleanName('   ', 'Photo 3')).toBe('Photo 3');
    expect(cleanName('x'.repeat(60), 'Photo 1')).toHaveLength(MAX_NAME_LENGTH);
  });
});

describe('Saved photos', () => {
  it('saves and loads on this device only', () => {
    const photos = addPhoto([], jpeg, 'Our dog', 1);
    expect(savePhotos(photos)).toBe(true);
    expect(loadPhotos()).toEqual(photos);
    expect(photos[0].name).toBe('Our dog');
  });

  it(`keeps at most ${MAX_PHOTOS} photos`, () => {
    let photos: SavedPhoto[] = [];
    for (let i = 0; i < MAX_PHOTOS; i += 1) photos = addPhoto(photos, jpeg, '', i);
    expect(photos.map((photo) => photo.name)).toContain(`Photo ${MAX_PHOTOS}`);
    expect(errorKind(() => addPhoto(photos, jpeg, 'one more'))).toBe('full');
  });

  it('ignores damaged or unexpected saved data', () => {
    localStorage.setItem(PHOTOS_KEY, '{not json');
    expect(loadPhotos()).toEqual([]);
    localStorage.setItem(PHOTOS_KEY, JSON.stringify([
      { id: 'a', name: 'ok', dataUrl: jpeg, addedAt: 1 },
      { id: 'b', name: 'remote', dataUrl: 'https://example.com/x.jpg', addedAt: 1 },
      { id: 'c', name: 'svg', dataUrl: 'data:image/svg+xml;base64,AAAA', addedAt: 1 },
      'junk',
    ]));
    expect(loadPhotos().map((photo) => photo.id)).toEqual(['a']);
  });

  it('deletes everything when cleared or emptied', () => {
    savePhotos(addPhoto([], jpeg, 'x'));
    clearPhotos();
    expect(localStorage.getItem(PHOTOS_KEY)).toBeNull();
    savePhotos(addPhoto([], jpeg, 'x'));
    savePhotos([]);
    expect(localStorage.getItem(PHOTOS_KEY)).toBeNull();
  });
});

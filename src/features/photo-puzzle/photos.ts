/**
 * Family photos for My Photo Puzzle. They never leave the device:
 * a parent picks a picture, it is cropped to a square and made smaller here,
 * and the result is saved in this app's local storage. Re-encoding to JPEG
 * drops the original file's metadata, such as where and when it was taken.
 */
export const PHOTOS_KEY = 'kids-learning-photos';
export const MAX_PHOTOS = 8;
export const PHOTO_SIZE = 600;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_NAME_LENGTH = 24;
const JPEG_QUALITY = 0.82;
const DATA_URL_PREFIX = 'data:image/jpeg;base64,';

export interface SavedPhoto {
  id: string;
  name: string;
  dataUrl: string;
  addedAt: number;
}

export type PhotoErrorKind = 'not-image' | 'too-big' | 'unreadable' | 'full' | 'storage';

export class PhotoError extends Error {
  kind: PhotoErrorKind;

  constructor(kind: PhotoErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

export const photoErrorText: Record<PhotoErrorKind, string> = {
  'not-image': 'That file is not a picture. Please choose a photo.',
  'too-big': 'That photo file is very large. Please choose a smaller one.',
  unreadable: 'This device could not open that photo. Try a JPEG or PNG picture.',
  full: `There is room for ${MAX_PHOTOS} photos. Delete one to add another.`,
  storage: 'There is not enough space on this device to save the photo.',
};

function isPhoto(value: unknown): value is SavedPhoto {
  if (typeof value !== 'object' || value === null) return false;
  const photo = value as Record<string, unknown>;
  return typeof photo.id === 'string'
    && typeof photo.name === 'string'
    && typeof photo.dataUrl === 'string'
    && photo.dataUrl.startsWith(DATA_URL_PREFIX)
    && typeof photo.addedAt === 'number';
}

export function loadPhotos(): SavedPhoto[] {
  try {
    const raw = localStorage.getItem(PHOTOS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPhoto).slice(0, MAX_PHOTOS) : [];
  } catch {
    return [];
  }
}

/** Returns false when the device has no room, so the caller can say so. */
export function savePhotos(photos: SavedPhoto[]): boolean {
  try {
    if (photos.length === 0) localStorage.removeItem(PHOTOS_KEY);
    else localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
    return true;
  } catch {
    return false;
  }
}

export function clearPhotos(): void {
  try {
    localStorage.removeItem(PHOTOS_KEY);
  } catch {
    // Storage unavailable: there is nothing saved to clear.
  }
}

export function cleanName(name: string, fallback: string): string {
  const trimmed = name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  return trimmed || fallback;
}

/** The largest centred square inside a picture, so faces in the middle stay in. */
export function centerSquare(width: number, height: number): { sx: number; sy: number; size: number } {
  const size = Math.min(width, height);
  return { sx: Math.round((width - size) / 2), sy: Math.round((height - size) / 2), size };
}

export function checkFile(file: { type: string; size: number }): void {
  if (!file.type.startsWith('image/')) throw new PhotoError('not-image');
  if (file.size > MAX_FILE_BYTES) throw new PhotoError('too-big');
}

type Drawable = CanvasImageSource & { width: number; height: number };

async function decode(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall back to an <img>, which some browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return Object.assign(image, { width: image.naturalWidth, height: image.naturalHeight });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Crops, shrinks, and re-encodes a picked photo. Nothing is uploaded. */
export async function preparePhoto(file: File): Promise<string> {
  checkFile(file);
  let image: Drawable;
  try {
    image = await decode(file);
  } catch {
    throw new PhotoError('unreadable');
  }
  if (!image.width || !image.height) throw new PhotoError('unreadable');
  const { sx, sy, size } = centerSquare(image.width, image.height);
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoError('unreadable');
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
  context.drawImage(image, sx, sy, size, size, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  if ('close' in image && typeof image.close === 'function') image.close();
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  if (!dataUrl.startsWith(DATA_URL_PREFIX)) throw new PhotoError('unreadable');
  return dataUrl;
}

export function addPhoto(photos: SavedPhoto[], dataUrl: string, name: string, now = Date.now()): SavedPhoto[] {
  if (photos.length >= MAX_PHOTOS) throw new PhotoError('full');
  const photo: SavedPhoto = {
    id: `photo-${now}-${Math.floor(Math.random() * 1e6)}`,
    name: cleanName(name, `Photo ${photos.length + 1}`),
    dataUrl,
    addedAt: now,
  };
  return [...photos, photo];
}

/**
 * A short-lived object URL for a saved photo, so puzzle pieces share one decoded image
 * instead of copying the long data URL into every piece. Falls back to the data URL.
 */
export function photoUrl(dataUrl: string): { url: string; release: () => void } {
  if (typeof URL.createObjectURL !== 'function' || typeof atob !== 'function') return { url: dataUrl, release: () => {} };
  try {
    const bytes = atob(dataUrl.slice(DATA_URL_PREFIX.length));
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([buffer], { type: 'image/jpeg' }));
    return { url, release: () => URL.revokeObjectURL(url) };
  } catch {
    return { url: dataUrl, release: () => {} };
  }
}

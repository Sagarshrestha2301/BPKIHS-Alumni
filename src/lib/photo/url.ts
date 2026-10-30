import { STORED_PHOTO_PREFIX } from '@/lib/constants/photo';

/**
 * The database stores a private storage key (`photo:<uuid>.webp`), never a public path. The
 * API maps it to a URL that re-checks the viewer and the profile's privacy setting on every
 * request, so deleting or hiding a photo takes effect immediately.
 */
export function isStoredPhoto(value: string | null | undefined): value is string {
  return Boolean(value?.startsWith(STORED_PHOTO_PREFIX));
}

/** The random file id, used as a cache-busting version because a file never changes. */
export function photoVersion(key: string): string {
  return key.slice(STORED_PHOTO_PREFIX.length).replace(/\.[a-z0-9]+$/i, '');
}

export function profilePhotoUrl(profileId: string, key: string): string {
  return `/api/v1/alumni/${encodeURIComponent(profileId)}/photo?v=${encodeURIComponent(
    photoVersion(key),
  )}`;
}

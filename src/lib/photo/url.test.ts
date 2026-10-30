import { describe, expect, it } from 'vitest';

import { isStoredPhoto, photoVersion, profilePhotoUrl } from './url';

const KEY = 'photo:01234567-89ab-cdef-0123-456789abcdef.webp';

describe('photo url helpers', () => {
  it('recognises only keys written by the storage layer', () => {
    expect(isStoredPhoto(KEY)).toBe(true);
    expect(isStoredPhoto('https://example.org/photo.jpg')).toBe(false);
    expect(isStoredPhoto(null)).toBe(false);
    expect(isStoredPhoto('')).toBe(false);
  });

  it('uses the random file id as the cache version', () => {
    expect(photoVersion(KEY)).toBe('01234567-89ab-cdef-0123-456789abcdef');
  });

  it('builds a viewer-checked API URL, not a file path', () => {
    expect(profilePhotoUrl('alumnus-1', KEY)).toBe(
      '/api/v1/alumni/alumnus-1/photo?v=01234567-89ab-cdef-0123-456789abcdef',
    );
  });

  it('encodes a profile id safely', () => {
    expect(profilePhotoUrl('alumnus one', KEY)).toBe(
      '/api/v1/alumni/alumnus%20one/photo?v=01234567-89ab-cdef-0123-456789abcdef',
    );
  });
});

import { describe, expect, it } from 'vitest';

import { PHOTO_MAX_BYTES } from '@/lib/constants/photo';

import { validatePhotoFile } from './validate';

function file(size: number, type: string): Pick<File, 'size' | 'type'> {
  return { size, type };
}

describe('validatePhotoFile', () => {
  it('accepts the three supported image types below the limit', () => {
    expect(validatePhotoFile(file(1024, 'image/jpeg'))).toBeNull();
    expect(validatePhotoFile(file(1024, 'image/png'))).toBeNull();
    expect(validatePhotoFile(file(1024, 'image/webp'))).toBeNull();
  });

  it('rejects an empty file', () => {
    expect(validatePhotoFile(file(0, 'image/png'))).toBe('empty');
  });

  it('rejects a file that is not an accepted image type', () => {
    expect(validatePhotoFile(file(1024, 'image/gif'))).toBe('type');
    expect(validatePhotoFile(file(1024, 'application/pdf'))).toBe('type');
  });

  it('rejects a file over the size limit', () => {
    expect(validatePhotoFile(file(PHOTO_MAX_BYTES + 1, 'image/png'))).toBe('size');
  });
});

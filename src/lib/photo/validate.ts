import { PHOTO_MAX_BYTES, PHOTO_MIME_TYPES } from '@/lib/constants/photo';

/** The reason a chosen file is not acceptable, if any. */
export type PhotoProblem = 'empty' | 'type' | 'size';

/**
 * The checks a browser can make without decoding the image. The server repeats them and adds
 * a real decode, so a forged MIME type still fails there.
 */
export function validatePhotoFile(file: Pick<File, 'size' | 'type'>): PhotoProblem | null {
  if (file.size <= 0) return 'empty';
  if (!(PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) return 'type';
  if (file.size > PHOTO_MAX_BYTES) return 'size';
  return null;
}

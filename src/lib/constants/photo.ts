/**
 * Profile-photo limits shared by the browser and the server.
 *
 * Keeping one set of values means the file picker rejects the same things the API does. The
 * server still re-checks everything: a browser is not a security boundary.
 */

/** Largest file a member may choose. Kept well below the request-size guard. */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Smallest accepted source image, in pixels on each side. */
export const PHOTO_MIN_DIMENSION = 200;

/** Largest accepted source image, in pixels on each side. Also caps decoded pixels. */
export const PHOTO_MAX_DIMENSION = 6000;

/** The stored square. Large enough for a profile at 3x, small enough for a card. */
export const PHOTO_OUTPUT_SIZE = 512;

/** WebP quality for the re-encoded file. Metadata is never copied. */
export const PHOTO_OUTPUT_QUALITY = 82;

/** Formats the API decodes. SVG, GIF and AVIF are deliberately excluded. */
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type PhotoMimeType = (typeof PHOTO_MIME_TYPES)[number];

/** Value for the file input's `accept` attribute. */
export const PHOTO_ACCEPT = PHOTO_MIME_TYPES.join(',');

/** Extension of every stored file after re-encoding. */
export const PHOTO_OUTPUT_EXTENSION = 'webp';

/** Prefix that marks a database value as a file in our own storage, not an external URL. */
export const STORED_PHOTO_PREFIX = 'photo:';

/** Room for multipart boundaries and the consent field around the image itself. */
export const PHOTO_FORM_OVERHEAD_BYTES = 64 * 1024;

/** Whole megabytes, for copy such as "larger than 5 MB". */
export function photoMaxMegabytes(): number {
  return Math.round(PHOTO_MAX_BYTES / (1024 * 1024));
}

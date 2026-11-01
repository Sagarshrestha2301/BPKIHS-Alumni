import 'server-only';

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp, { type Metadata } from 'sharp';

import { photoCopy } from '@/content/photo';
import { ApiError } from '@/lib/api/errors';
import {
  PHOTO_MIME_TYPES,
  PHOTO_OUTPUT_EXTENSION,
  STORED_PHOTO_PREFIX,
} from '@/lib/constants/photo';
import { isStoredPhoto } from '@/lib/photo/url';

import { config } from '../config';

/**
 * Profile photos live on the app server's disk, next to the Postgres deployment the project
 * documents. They are never placed under `public/`: a file that anyone can guess or fetch
 * without a database check would bypass profile privacy.
 *
 * `sharp` decodes the image, rejects anything that is not a real JPEG/PNG/WebP, crops a square
 * and re-encodes it. Re-encoding is deliberate: it removes EXIF/GPS metadata, normalises the
 * format, and destroys a file that is also a script or an archive.
 */

const STORED_FILE = new RegExp(
  `^${STORED_PHOTO_PREFIX}([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.${PHOTO_OUTPUT_EXTENSION}$`,
);
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

function photoDirectory(): string {
  return path.resolve(process.cwd(), config.photos.directory);
}

/** Strictly maps a database key to a filename; anything else is treated as missing. */
function fileNameFor(key: string): string | null {
  const match = STORED_FILE.exec(key);
  return match?.[1] ? `${match[1]}.${PHOTO_OUTPUT_EXTENSION}` : null;
}

function absoluteFileFor(key: string): string | null {
  const fileName = fileNameFor(key);
  if (!fileName) return null;
  const directory = photoDirectory();
  const file = path.resolve(directory, fileName);
  // The regex already forbids separators; this keeps that guarantee true if it ever changes.
  return path.dirname(file) === directory ? file : null;
}

function invalidImage(message: string): never {
  throw new ApiError('validation', message);
}

/**
 * Validates and stores one uploaded file. Returns the private key for `alumni.photo_url`;
 * the public URL is built later from the profile id, so a key cannot be fetched directly.
 */
export async function storeProfilePhoto(file: File): Promise<string> {
  if (file.size <= 0) invalidImage(photoCopy.errors.empty);
  if (file.size > config.photos.maxBytes) invalidImage(photoCopy.errors.size);
  if (!(PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
    invalidImage(photoCopy.errors.type);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let metadata: Metadata;
  try {
    const image = sharp(buffer, {
      failOn: 'error',
      // Bounds the decoded image as well as its dimensions, so a small "decompression bomb"
      // cannot allocate gigabytes of memory.
      limitInputPixels: config.photos.maxDimension * config.photos.maxDimension,
      animated: false,
    });
    metadata = await image.metadata();

    if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
      invalidImage(photoCopy.errors.type);
    }
    if (!metadata.width || !metadata.height) invalidImage(photoCopy.errors.unreadable);
    if ((metadata.pages ?? 1) > 1) invalidImage(photoCopy.errors.animated);
    if (
      metadata.width < config.photos.minDimension ||
      metadata.height < config.photos.minDimension
    ) {
      invalidImage(photoCopy.errors.tooSmall);
    }
    if (
      metadata.width > config.photos.maxDimension ||
      metadata.height > config.photos.maxDimension
    ) {
      invalidImage(photoCopy.errors.tooLarge);
    }

    const output = await image
      .rotate() // Apply the camera orientation, then drop the EXIF tag that carried it.
      .resize({
        width: config.photos.outputSize,
        height: config.photos.outputSize,
        fit: 'cover',
        position: 'attention',
      })
      .webp({ quality: config.photos.quality, effort: 4 })
      .toBuffer();

    if (output.length > config.photos.maxBytes) invalidImage(photoCopy.errors.size);

    const id = randomUUID();
    const directory = photoDirectory();
    const target = path.join(directory, `${id}.${PHOTO_OUTPUT_EXTENSION}`);
    const temporary = path.join(directory, `.${id}.tmp`);

    await mkdir(directory, { recursive: true, mode: config.photos.directoryMode });
    try {
      await writeFile(temporary, output, { mode: config.photos.fileMode });
      await rename(temporary, target);
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      console.error('[photos] could not write a profile photo', error);
      throw new ApiError('server', photoCopy.errors.upload);
    }

    return `${STORED_PHOTO_PREFIX}${id}.${PHOTO_OUTPUT_EXTENSION}`;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Sharp's messages include paths and implementation detail; the member gets the copy.
    console.error('[photos] rejected an uploaded image', error);
    invalidImage(photoCopy.errors.unreadable);
  }
}

/** Reads a stored key. Missing, malformed and unreadable files all become a 404. */
export async function readStoredPhoto(key: string): Promise<Buffer> {
  const file = absoluteFileFor(key);
  if (!file) throw new ApiError('not_found', photoCopy.errors.notFound);

  try {
    return await readFile(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[photos] could not read a profile photo', error);
    }
    throw new ApiError('not_found', photoCopy.errors.notFound);
  }
}

/**
 * Best-effort removal. A database row must not keep pointing at a file that is gone, so a
 * failure here is logged rather than thrown to the member; the row is cleared either way.
 */
export async function deleteStoredPhoto(key: string | null | undefined): Promise<void> {
  if (!isStoredPhoto(key)) return;
  const file = absoluteFileFor(key);
  if (!file) return;

  try {
    await rm(file, { force: true });
  } catch (error) {
    console.error('[photos] could not delete a profile photo', error);
  }
}

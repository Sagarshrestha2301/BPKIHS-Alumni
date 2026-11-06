import 'server-only';

import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
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
import { db } from '../db/client';
import { profilePhotos } from '../db/schema';

/**
 * Profile photos are kept in Postgres rather than on the app server's disk. A serverless
 * host (such as Vercel) has a read-only filesystem, and even a writable `/tmp` is not
 * shared between the upload and the delivery functions. The database is the one store every
 * function can reach, so the bytes live in `profile_photos` and `alumni.photo_url` keeps
 * the private `photo:<uuid>.webp` key.
 *
 * `sharp` decodes the image, rejects anything that is not a real JPEG/PNG/WebP, crops a
 * square and re-encodes it. Re-encoding is deliberate: it removes EXIF/GPS metadata,
 * normalises the format, and destroys a file that is also a script or an archive.
 */

const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

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
  let output: Buffer;
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

    output = await image
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
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Sharp's messages include paths and implementation detail; the member gets the copy.
    console.error('[photos] rejected an uploaded image', error);
    invalidImage(photoCopy.errors.unreadable);
  }

  const id = randomUUID();
  const key = `${STORED_PHOTO_PREFIX}${id}.${PHOTO_OUTPUT_EXTENSION}`;

  try {
    await db.insert(profilePhotos).values({ key, data: output.toString('base64') });
  } catch (error) {
    console.error('[photos] could not store a profile photo', error);
    throw new ApiError('server', photoCopy.errors.upload);
  }

  return key;
}

/** Reads a stored key. Missing or unreadable rows become a 404. */
export async function readStoredPhoto(key: string): Promise<Buffer> {
  if (!isStoredPhoto(key)) throw new ApiError('not_found', photoCopy.errors.notFound);

  const [row] = await db
    .select({ data: profilePhotos.data })
    .from(profilePhotos)
    .where(eq(profilePhotos.key, key));

  if (!row) throw new ApiError('not_found', photoCopy.errors.notFound);

  try {
    return Buffer.from(row.data, 'base64');
  } catch (error) {
    console.error('[photos] could not read a profile photo', error);
    throw new ApiError('not_found', photoCopy.errors.notFound);
  }
}

/**
 * Best-effort removal. A database row must not keep pointing at bytes that are gone, so a
 * failure here is logged rather than thrown to the member; the row is cleared either way.
 */
export async function deleteStoredPhoto(key: string | null | undefined): Promise<void> {
  if (!isStoredPhoto(key)) return;

  try {
    await db.delete(profilePhotos).where(eq(profilePhotos.key, key));
  } catch (error) {
    console.error('[photos] could not delete a profile photo', error);
  }
}

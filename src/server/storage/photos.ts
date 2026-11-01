import 'server-only';

import { randomUUID } from 'node:crypto';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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

const BUCKET = 'assets';

function s3Client(): S3Client {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new ApiError('server', 'Neon Object Storage is not configured.');
  }
  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

const STORED_FILE = new RegExp(
  `^${STORED_PHOTO_PREFIX}([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.${PHOTO_OUTPUT_EXTENSION}$`,
);
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

function objectKeyFor(key: string): string | null {
  const match = STORED_FILE.exec(key);
  return match?.[1] ? `${match[1]}.${PHOTO_OUTPUT_EXTENSION}` : null;
}

function invalidImage(message: string): never {
  throw new ApiError('validation', message);
}

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
      .rotate()
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
    console.error('[photos] rejected an uploaded image', error);
    invalidImage(photoCopy.errors.unreadable);
  }

  const id = randomUUID();
  const objectKey = `${id}.${PHOTO_OUTPUT_EXTENSION}`;
  try {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: objectKey,
        Body: output,
        ContentType: 'image/webp',
      }),
    );
  } catch (error) {
    console.error('[photos] could not upload a profile photo', error);
    throw new ApiError('server', photoCopy.errors.upload);
  }

  return `${STORED_PHOTO_PREFIX}${id}.${PHOTO_OUTPUT_EXTENSION}`;
}

export async function readStoredPhoto(key: string): Promise<Buffer> {
  const objectKey = objectKeyFor(key);
  if (!objectKey) throw new ApiError('not_found', photoCopy.errors.notFound);

  try {
    const res = await s3Client().send(new GetObjectCommand({ Bucket: BUCKET, Key: objectKey }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error('empty body');
    return Buffer.from(bytes);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[photos] could not read a profile photo', error);
    throw new ApiError('not_found', photoCopy.errors.notFound);
  }
}

export async function deleteStoredPhoto(key: string | null | undefined): Promise<void> {
  if (!isStoredPhoto(key)) return;
  const objectKey = objectKeyFor(key as string);
  if (!objectKey) return;

  try {
    await s3Client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: objectKey }));
  } catch (error) {
    console.error('[photos] could not delete a profile photo', error);
  }
}

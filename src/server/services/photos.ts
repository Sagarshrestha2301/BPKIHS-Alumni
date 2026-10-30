import { eq } from 'drizzle-orm';

import { photoCopy } from '@/content/photo';
import { ApiError } from '@/lib/api/errors';
import { canSee, type Viewer } from '@/lib/api/privacy';
import type { ProfilePhotoResult } from '@/lib/api/types';
import { isStoredPhoto, profilePhotoUrl } from '@/lib/photo/url';

import { db } from '../db/client';
import { alumni } from '../db/schema';
import { deleteStoredPhoto, readStoredPhoto, storeProfilePhoto } from '../storage/photos';

/**
 * A member's own photo.
 *
 * Consent is checked before a byte is written: an upload without it is refused rather than
 * stored and hidden. Replacing a consented photo does not ask again, but the checkbox is shown
 * until the first agreement.
 */

async function ownRow(userId: string) {
  const [row] = await db
    .select({
      id: alumni.id,
      status: alumni.status,
      photoUrl: alumni.photoUrl,
      photoConsent: alumni.photoConsent,
    })
    .from(alumni)
    .where(eq(alumni.userId, userId));
  return row;
}

export async function saveOwnPhoto(
  userId: string,
  file: File,
  consent: boolean,
): Promise<ProfilePhotoResult> {
  const existing = await ownRow(userId);
  if (!existing) throw new ApiError('not_found', 'This account has no alumni profile yet.');
  if (!existing.photoConsent && !consent) {
    throw new ApiError('validation', photoCopy.errors.consent, {
      fieldErrors: { consent: photoCopy.errors.consent },
    });
  }

  const key = await storeProfilePhoto(file);
  const now = new Date();

  try {
    const [row] = await db
      .update(alumni)
      .set({
        photoUrl: key,
        photoConsent: true,
        // A rejected profile is corrected by the same edit that saves other fields.
        ...(existing.status === 'rejected'
          ? {
              status: 'pending' as const,
              rejectionReason: null,
              approvedAt: null,
              approvedBy: null,
            }
          : {}),
        updatedAt: now,
      })
      .where(eq(alumni.id, existing.id))
      .returning({ id: alumni.id, photoUrl: alumni.photoUrl });
    if (!row) throw new ApiError('not_found', 'This account has no alumni profile yet.');

    // Only now is the old file unreferenced. A failure leaves an orphan, never a broken page.
    if (existing.photoUrl !== key) await deleteStoredPhoto(existing.photoUrl);

    return { photoUrl: profilePhotoUrl(row.id, key), photoConsent: true };
  } catch (error) {
    await deleteStoredPhoto(key);
    throw error;
  }
}

export async function removeOwnPhoto(userId: string): Promise<ProfilePhotoResult> {
  const existing = await ownRow(userId);
  if (!existing) throw new ApiError('not_found', 'This account has no alumni profile yet.');

  const [row] = await db
    .update(alumni)
    .set({ photoUrl: null, photoConsent: false, updatedAt: new Date() })
    .where(eq(alumni.id, existing.id))
    .returning({ id: alumni.id });
  if (!row) throw new ApiError('not_found', 'This account has no alumni profile yet.');

  await deleteStoredPhoto(existing.photoUrl);
  return { photoConsent: false };
}

export interface PhotoViewer extends Viewer {
  userId?: string;
  isAdmin: boolean;
}

export interface StoredPhoto {
  data: Buffer;
  contentType: 'image/webp';
  etag: string;
  cacheControl: string;
}

/**
 * Resolves a photo only for someone allowed to see the profile it belongs to. The owner and
 * an administrator can preview a pending or rejected record; everyone else follows the same
 * visibility rule as the directory.
 */
export async function readProfilePhoto(
  profileId: string,
  viewer: PhotoViewer,
): Promise<StoredPhoto> {
  const [row] = await db
    .select({
      userId: alumni.userId,
      status: alumni.status,
      privacyProfile: alumni.privacyProfile,
      photoUrl: alumni.photoUrl,
      photoConsent: alumni.photoConsent,
    })
    .from(alumni)
    .where(eq(alumni.id, profileId));

  if (!row?.photoUrl || !row.photoConsent || !isStoredPhoto(row.photoUrl)) {
    throw new ApiError('not_found', photoCopy.errors.notFound);
  }

  const isOwner = Boolean(viewer.userId && row.userId === viewer.userId);
  const visibleToViewer = row.status === 'approved' && canSee(row.privacyProfile, viewer);
  if (!isOwner && !viewer.isAdmin && !visibleToViewer) {
    throw new ApiError('not_found', photoCopy.errors.notFound);
  }

  const data = await readStoredPhoto(row.photoUrl);
  return {
    data,
    contentType: 'image/webp',
    etag: `"${row.photoUrl}"`,
    // Never `public`: the proxy may add a CSRF cookie, and a hidden profile must not stay in
    // a shared cache after its owner changes the setting.
    cacheControl: isOwner || viewer.isAdmin ? 'private, no-store' : 'private, max-age=300',
  };
}

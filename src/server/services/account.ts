import { eq } from 'drizzle-orm';

import { ApiError } from '@/lib/api/errors';
import type { ProfileUpdateInput } from '@/lib/api/schemas';
import type { Alumnus } from '@/lib/api/types';

import { db } from '../db/client';
import { alumni, user } from '../db/schema';
import { toAlumnus } from './alumni';

/**
 * The member's own profile update.
 *
 * Only the fields in `profileUpdateSchema` are written. Programme, batch year, email and the
 * approval audit columns are not in the input type, so a crafted request cannot reach them. An
 * approved profile stays approved and the edit is public immediately; a rejected one goes back
 * to `pending` so the corrected details are reviewed again instead of staying invisible.
 */
export async function updateOwnProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<Alumnus> {
  const [existing] = await db
    .select({ id: alumni.id, fullName: alumni.fullName, status: alumni.status })
    .from(alumni)
    .where(eq(alumni.userId, userId));
  if (!existing) throw new ApiError('not_found', 'This account has no alumni profile yet.');

  // A rejected profile is editable for exactly this reason: saving resubmits it for review.
  const requeue = existing.status === 'rejected';
  const now = new Date();
  const [row] = await db
    .update(alumni)
    .set({
      fullName: input.fullName,
      phone: input.phone || null,
      furtherStudies: input.furtherStudies || null,
      currentPosition: input.currentPosition || null,
      organisation: input.organisation || null,
      city: input.city || null,
      country: input.country,
      note: input.note || null,
      expertise: input.expertise,
      privacyEmail: input.privacy.email,
      privacyPhone: input.privacy.phone,
      privacyProfile: input.privacy.profile,
      ...(requeue
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
    .returning();
  if (!row) throw new ApiError('not_found', 'This account has no alumni profile yet.');

  // The account name is what sign-in and email greetings use; keep it in step with the profile.
  if (existing.fullName !== row.fullName) {
    await db.update(user).set({ name: row.fullName, updatedAt: now }).where(eq(user.id, userId));
  }

  return toAlumnus(row);
}

import { and, eq, ne, sql } from 'drizzle-orm';

import { emailCopy } from '@/content/email';
import { ApiError } from '@/lib/api/errors';
import { formatNpr } from '@/lib/format/money';

import { db } from '../db/client';
import { donationGoals, donations, paymentEvents, user } from '../db/schema';
import { sendEmailSafely } from '../email';
import type { PaymentVerification } from './types';

export interface CompletedDonation {
  donationId: string;
  status: 'succeeded' | 'failed';
  amountMinor: number;
  goalTitle?: string;
  method: string;
}

export async function completeDonation(
  verification: PaymentVerification,
  gateway: 'esewa' | 'khalti',
): Promise<CompletedDonation> {
  if (!verification.donationId) {
    throw new ApiError('validation', 'The payment callback did not include our donation id.');
  }

  const [donation] = await db
    .select()
    .from(donations)
    .where(eq(donations.id, verification.donationId));
  if (!donation) throw new ApiError('not_found', 'That donation was not found.');

  // A signed callback still has to match the amount we asked for.
  if (
    verification.amountMinor !== undefined &&
    verification.amountMinor !== Number(donation.amountMinor)
  ) {
    throw new ApiError(
      'conflict',
      'The amount confirmed by the gateway does not match the donation.',
    );
  }

  // Keep every accepted callback for reconciliation. A retried callback collides on
  // (gateway, external_id) and is ignored rather than duplicated.
  await db
    .insert(paymentEvents)
    .values({
      id: crypto.randomUUID(),
      donationId: donation.id,
      gateway,
      eventType: verification.status,
      externalId: verification.reference || null,
      payload: verification.payload,
    })
    .onConflictDoNothing();

  const [goal] = donation.goalId
    ? await db
        .select({ title: donationGoals.title })
        .from(donationGoals)
        .where(eq(donationGoals.id, donation.goalId))
    : [];

  if (verification.status === 'failed') {
    await db
      .update(donations)
      .set({
        status: 'failed',
        gatewayRef: verification.reference,
        gatewayPayload: verification.payload,
      })
      .where(and(eq(donations.id, donation.id), ne(donations.status, 'succeeded')));
    return {
      donationId: donation.id,
      status: 'failed',
      amountMinor: Number(donation.amountMinor),
      ...(goal ? { goalTitle: goal.title } : {}),
      method: donation.method,
    };
  }

  if (donation.status !== 'succeeded') {
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(donations)
        .set({
          status: 'succeeded',
          gateway,
          gatewayRef: verification.reference,
          gatewayPayload: verification.payload,
          updatedAt: new Date(),
        })
        .where(and(eq(donations.id, donation.id), ne(donations.status, 'succeeded')))
        .returning({
          id: donations.id,
          goalId: donations.goalId,
          amountMinor: donations.amountMinor,
        });

      if (!updated) return;
      if (updated.goalId) {
        await tx
          .update(donationGoals)
          .set({
            raisedMinor: sql`${donationGoals.raisedMinor} + ${updated.amountMinor}`,
            updatedAt: new Date(),
          })
          .where(eq(donationGoals.id, updated.goalId));
      }
    });

    if (donation.userId) {
      const [donor] = await db
        .select({ email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, donation.userId));
      if (donor) {
        await sendEmailSafely({
          to: donor.email,
          ...emailCopy.donationReceipt({
            name: donor.name,
            amount: formatNpr(Number(donation.amountMinor)),
            reference: donation.id,
            ...(goal ? { goalTitle: goal.title } : {}),
          }),
        });
      }
    }
  }

  return {
    donationId: donation.id,
    status: 'succeeded',
    amountMinor: Number(donation.amountMinor),
    ...(goal ? { goalTitle: goal.title } : {}),
    method: donation.method,
  };
}

import { asc, desc, eq, sql } from 'drizzle-orm';

import type { AdminGoal } from '@/lib/api/admin';
import type { AdminGoalInput } from '@/lib/api/admin-schemas';
import { ApiError } from '@/lib/api/errors';
import type { DonationInput } from '@/lib/api/schemas';
import type { DonationGoal, DonationResult, FundsBreakdownItem } from '@/lib/api/types';
import { CURRENCY } from '@/lib/constants/domain';

import { config } from '../config';
import { db } from '../db/client';
import { donationGoals, donations, fundsBreakdown } from '../db/schema';
import { gatewayFor, paymentMode, startPayment } from '../payments';

function toGoal(row: typeof donationGoals.$inferSelect): DonationGoal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    targetMinor: Number(row.targetMinor),
    raisedMinor: Number(row.raisedMinor),
    currency: CURRENCY,
    ...(row.deadline ? { deadline: row.deadline.toISOString() } : {}),
    ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
    placeholder: row.placeholder,
  };
}

export async function listGoals(): Promise<DonationGoal[]> {
  const rows = await db
    .select()
    .from(donationGoals)
    .where(eq(donationGoals.active, true))
    .orderBy(asc(donationGoals.sortOrder), asc(donationGoals.title));
  return rows.map(toGoal);
}

export async function getGoal(id: string): Promise<DonationGoal> {
  const [row] = await db.select().from(donationGoals).where(eq(donationGoals.id, id));
  if (!row) throw new ApiError('not_found', 'That giving goal was not found.');
  return toGoal(row);
}

export async function getFundsBreakdown(): Promise<FundsBreakdownItem[]> {
  const [totalRow] = await db
    .select({ value: sql<string>`coalesce(sum(${donationGoals.raisedMinor}), 0)` })
    .from(donationGoals);
  const total = Number(totalRow?.value ?? 0);

  const shares = await db.select().from(fundsBreakdown).orderBy(asc(fundsBreakdown.sortOrder));

  let allocated = 0;
  return shares.map((item, index) => {
    const amountMinor =
      index === shares.length - 1
        ? total - allocated
        : Math.round((total * item.sharePercent) / 100);
    allocated += amountMinor;
    return {
      category: item.category,
      sharePercent: item.sharePercent,
      amountMinor,
    };
  });
}

export interface DonorDetails {
  userId?: string;
  name?: string;
  email?: string;
}

export async function createDonation(
  input: DonationInput,
  donor: DonorDetails = {},
): Promise<DonationResult> {
  if (input.goalId) {
    const goal = await getGoal(input.goalId);
    if (goal.placeholder === false && goal.raisedMinor >= goal.targetMinor) {
      throw new ApiError('conflict', 'That goal is already fully funded. Choose another one.');
    }
  }

  // Fail before writing anything if payments are not configured. A donation row only
  // becomes `succeeded` after the gateway callback has been verified.
  paymentMode();
  gatewayFor(input.method);
  const donationId = crypto.randomUUID();

  await db.insert(donations).values({
    id: donationId,
    userId: donor.userId ?? null,
    goalId: input.goalId ?? null,
    eventId: input.eventId ?? null,
    amountMinor: input.amountMinor,
    currency: input.currency,
    method: input.method,
    status: 'pending',
    anonymous: input.anonymous,
    tribute: input.tribute ?? null,
    gateway: input.method,
  });

  try {
    const redirect = await startPayment(input.method, {
      donationId,
      amountMinor: input.amountMinor,
      description: input.goalId
        ? config.payments.goalGiftDescription
        : config.payments.generalGiftDescription,
      donorName: donor.name ?? 'Donor',
      donorEmail: donor.email ?? '',
    });
    return { donationId, status: 'pending', redirect };
  } catch (error) {
    await db
      .update(donations)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(donations.id, donationId));
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Admin                                                              */
/* ------------------------------------------------------------------ */

function toAdminGoal(row: typeof donationGoals.$inferSelect): AdminGoal {
  return {
    ...toGoal(row),
    active: row.active,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listGoalsForAdmin(): Promise<AdminGoal[]> {
  const rows = await db
    .select()
    .from(donationGoals)
    .orderBy(asc(donationGoals.sortOrder), asc(donationGoals.title));
  return rows.map(toAdminGoal);
}

function goalValues(input: AdminGoalInput) {
  return {
    title: input.title,
    description: input.description,
    targetMinor: input.targetMinor,
    deadline: input.deadline ? new Date(input.deadline) : null,
    imageUrl: input.imageUrl || null,
    active: input.active,
    sortOrder: input.sortOrder,
    updatedAt: new Date(),
  };
}

export async function createGoal(input: AdminGoalInput): Promise<AdminGoal> {
  const [row] = await db
    .insert(donationGoals)
    .values({
      id: `goal-${crypto.randomUUID()}`,
      ...goalValues(input),
      ...(input.raisedMinor !== undefined ? { raisedMinor: input.raisedMinor } : {}),
    })
    .returning();
  if (!row) throw new ApiError('server', 'The goal could not be saved.');
  return toAdminGoal(row);
}

export async function updateGoal(id: string, input: AdminGoalInput): Promise<AdminGoal> {
  const [row] = await db
    .update(donationGoals)
    .set({
      ...goalValues(input),
      ...(input.raisedMinor !== undefined ? { raisedMinor: input.raisedMinor } : {}),
    })
    .where(eq(donationGoals.id, id))
    .returning();
  if (!row) throw new ApiError('not_found', 'That giving goal was not found.');
  return toAdminGoal(row);
}

export async function deleteGoal(id: string): Promise<{ ok: true }> {
  const [used] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(donations)
    .where(eq(donations.goalId, id));
  if (Number(used?.value ?? 0) > 0) {
    throw new ApiError(
      'conflict',
      'This goal has donations recorded against it. Mark it inactive instead of deleting it.',
    );
  }

  const [row] = await db
    .delete(donationGoals)
    .where(eq(donationGoals.id, id))
    .returning({ id: donationGoals.id });
  if (!row) throw new ApiError('not_found', 'That giving goal was not found.');
  return { ok: true };
}

/** Donation statuses an export may be filtered by. */
export const DONATION_STATUSES = ['pending', 'succeeded', 'failed'] as const;
export type DonationExportStatus = (typeof DONATION_STATUSES)[number];

export interface DonationExportRow {
  id: string;
  /** Amount in rupees with two decimals, ready for a spreadsheet. */
  amountNpr: string;
  method: string;
  status: string;
  goal: string;
  recordedAt: string;
}

/**
 * The whole ledger, newest first, for the CSV export.
 *
 * Unlike the paged read this has no offsets: one click means one file. `config.pagination.exportLimit`
 * caps it so the endpoint cannot stream an unbounded table.
 */
export async function listDonationsForExport(
  params: { status?: DonationExportStatus } = {},
): Promise<DonationExportRow[]> {
  const rows = await db
    .select({
      id: donations.id,
      amountMinor: donations.amountMinor,
      method: donations.method,
      status: donations.status,
      recordedAt: donations.createdAt,
      goal: donationGoals.title,
    })
    .from(donations)
    .leftJoin(donationGoals, eq(donations.goalId, donationGoals.id))
    .where(params.status ? eq(donations.status, params.status) : undefined)
    .orderBy(desc(donations.createdAt))
    .limit(config.pagination.exportLimit);

  return rows.map((row) => ({
    id: row.id,
    amountNpr: (Number(row.amountMinor) / 100).toFixed(2),
    method: row.method,
    status: row.status,
    goal: row.goal ?? '',
    recordedAt: row.recordedAt.toISOString(),
  }));
}

export async function listDonationsForAdmin(params: { page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    config.pagination.maxPageSize,
    Math.max(1, params.pageSize ?? config.pagination.donationPageSize),
  );
  const [rows, total] = await Promise.all([
    db
      .select()
      .from(donations)
      .orderBy(donations.createdAt)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: sql<number>`count(*)::int` }).from(donations),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      amountMinor: Number(row.amountMinor),
      currency: row.currency,
      method: row.method,
      status: row.status,
      anonymous: row.anonymous,
      goalId: row.goalId,
      createdAt: row.createdAt.toISOString(),
    })),
    total: Number(total[0]?.value ?? 0),
    page,
    pageSize,
  };
}

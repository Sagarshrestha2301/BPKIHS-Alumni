import { and, asc, desc, eq, gte, ilike, isNotNull, or, sql } from 'drizzle-orm';

import type { AdminFundRow, AdminGoal, AdminGoalUpdate } from '@/lib/api/admin';
import type { AdminFundInput, AdminGoalInput, AdminGoalUpdateInput } from '@/lib/api/admin-schemas';
import { ApiError } from '@/lib/api/errors';
import type { DonationInput } from '@/lib/api/schemas';
import type {
  DonationGoal,
  DonationResult,
  FundsBreakdownItem,
  GoalUpdate,
  Paginated,
  PublicDonor,
} from '@/lib/api/types';
import { CURRENCY } from '@/lib/constants/domain';
import { DONATION_PAGE_SIZE } from '@/lib/constants/pagination';

import { config } from '../config';
import { db } from '../db/client';
import { donationGoals, donationGoalUpdates, donations, fundsBreakdown, user } from '../db/schema';
import { gatewayFor, paymentMode, startPayment } from '../payments';
import { type AdminGivingMonth, buildGivingMonths } from './donation-summary';

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
    .select({
      value: sql<string>`coalesce(sum(${donations.amountMinor}) filter (where ${donations.status} = 'succeeded'), 0)::text`,
    })
    .from(donations);
  const total = Number(totalRow?.value ?? 0);

  const shares = await db.select().from(fundsBreakdown).orderBy(asc(fundsBreakdown.sortOrder));

  const items: FundsBreakdownItem[] = shares.map((item) => ({
    category: item.category,
    sharePercent: item.sharePercent,
    amountMinor: Math.round((total * item.sharePercent) / 100),
  }));

  // A partly filled plan is shown honestly rather than inflating the last category: the
  // remainder appears as its own unallocated line until an admin assigns it.
  const allocatedShare = items.reduce((sum, item) => sum + item.sharePercent, 0);
  if (allocatedShare > 0 && allocatedShare < 100) {
    items.push({
      category: 'Unallocated',
      sharePercent: 100 - allocatedShare,
      amountMinor: Math.round((total * (100 - allocatedShare)) / 100),
    });
  }
  return items;
}

/* ------------------------------------------------------------------ */
/* Per-goal giving stats (goal cards and the goal detail page)          */
/* ------------------------------------------------------------------ */

export interface GoalGiftStat {
  goalId: string;
  /** Confirmed gifts recorded toward this goal. */
  gifts: number;
  /** The most recent confirmed gift, or null while none exist yet. */
  latestGiftAt: string | null;
}

export interface GivingStats {
  /** One entry per goal that has at least one confirmed gift, unsorted. */
  perGoal: GoalGiftStat[];
  /** Confirmed gifts across the site, general fund included. */
  gifts: number;
  /** Confirmed amount across the site, in paisa. */
  amountMinor: number;
}

/**
 * Ledger aggregates for the goal pages: counts and dates only. No donor rows are selected, so
 * the privacy rules of `listPublicDonors` (no amounts beside people, anonymous gifts stay
 * nameless) are untouched by this read.
 */
export async function getGivingStats(): Promise<GivingStats> {
  const [perGoal, totals] = await Promise.all([
    db
      .select({
        goalId: donations.goalId,
        gifts: sql<number>`count(*)::int`,
        latestGiftAt: sql<Date | null>`max(${donations.createdAt})`,
      })
      .from(donations)
      .where(and(eq(donations.status, 'succeeded'), isNotNull(donations.goalId)))
      .groupBy(donations.goalId),
    db
      .select({
        gifts: sql<number>`count(*)::int`,
        amountMinor: sql<string>`coalesce(sum(${donations.amountMinor}), 0)::text`,
      })
      .from(donations)
      .where(eq(donations.status, 'succeeded')),
  ]);

  return {
    perGoal: perGoal.map((row) => ({
      goalId: row.goalId as string,
      gifts: Number(row.gifts),
      latestGiftAt: row.latestGiftAt ? new Date(row.latestGiftAt).toISOString() : null,
    })),
    gifts: Number(totals[0]?.gifts ?? 0),
    amountMinor: Number(totals[0]?.amountMinor ?? 0),
  };
}

/**
 * Confirmed gifts for the public transparency page.
 *
 * Only four columns are read and an anonymous gift never leaves the query with a name, so a
 * caller cannot render an identity the donor asked to hide. Email and user ids are never
 * selected at all.
 */
export async function listPublicDonors(
  params: {
    page?: number;
    pageSize?: number;
    /** Only gifts toward this goal. */ goalId?: string;
  } = {},
): Promise<Paginated<PublicDonor>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    config.pagination.maxPageSize,
    Math.max(1, params.pageSize ?? config.pagination.donorPageSize),
  );

  const [rows, total] = await Promise.all([
    db
      .select({
        name: user.name,
        anonymous: donations.anonymous,
        goalTitle: donationGoals.title,
        givenAt: donations.createdAt,
      })
      .from(donations)
      .leftJoin(user, eq(donations.userId, user.id))
      .leftJoin(donationGoals, eq(donations.goalId, donationGoals.id))
      .where(
        and(
          eq(donations.status, 'succeeded'),
          params.goalId ? eq(donations.goalId, params.goalId) : undefined,
        ),
      )
      .orderBy(desc(donations.createdAt), desc(donations.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(donations)
      .where(
        and(
          eq(donations.status, 'succeeded'),
          params.goalId ? eq(donations.goalId, params.goalId) : undefined,
        ),
      ),
  ]);

  return {
    items: rows.map((row) => ({
      ...(!row.anonymous && row.name ? { name: row.name } : {}),
      ...(row.goalTitle ? { goalTitle: row.goalTitle } : {}),
      givenAt: row.givenAt.toISOString(),
    })),
    total: Number(total[0]?.value ?? 0),
    page,
    pageSize,
  };
}

export interface DonorDetails {
  userId?: string;
  name?: string;
  email?: string;
}

/**
 * ConnectIPS caps `TXNID` at 20 characters, so the 36-character donation id cannot be sent.
 * Every donation gets a short reference before it is written; an adapter that needs one sends
 * it, and its callback resolves the donation through it. 20 uppercase hex characters, which
 * is 80 bits of `randomUUID` worth of entropy and fits every gateway's field length.
 */
function gatewayOrderReference(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase();
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
  const gatewayOrderRef = gatewayOrderReference();

  await db.insert(donations).values({
    id: donationId,
    gatewayOrderRef,
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
      reference: gatewayOrderRef,
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

type GoalUpdateRow = typeof donationGoalUpdates.$inferSelect;

function toGoalUpdate(row: GoalUpdateRow): GoalUpdate {
  return {
    id: row.id,
    goalId: row.goalId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Narrative updates for one goal, newest first; capped so a busy goal cannot grow forever. */
export async function listGoalUpdates(goalId: string, limit = 20): Promise<GoalUpdate[]> {
  const rows = await db
    .select()
    .from(donationGoalUpdates)
    .where(eq(donationGoalUpdates.goalId, goalId))
    .orderBy(desc(donationGoalUpdates.createdAt))
    .limit(limit);
  return rows.map(toGoalUpdate);
}

export async function listGoalUpdatesForAdmin(): Promise<AdminGoalUpdate[]> {
  const rows = await db
    .select()
    .from(donationGoalUpdates)
    .orderBy(desc(donationGoalUpdates.createdAt));
  return rows.map(toGoalUpdate);
}

/** Posts an update. The goal must exist: a free-floating update is a data-integrity bug. */
export async function createGoalUpdate(input: AdminGoalUpdateInput): Promise<AdminGoalUpdate> {
  const goal = await db
    .select({ id: donationGoals.id })
    .from(donationGoals)
    .where(eq(donationGoals.id, input.goalId));
  if (!goal[0]) throw new ApiError('not_found', 'Choose a goal that exists.');

  const [row] = await db
    .insert(donationGoalUpdates)
    .values({
      id: `update-${crypto.randomUUID()}`,
      goalId: input.goalId,
      body: input.body,
    })
    .returning();
  if (!row) throw new ApiError('server', 'The update could not be saved.');
  return toGoalUpdate(row);
}

export async function updateGoalUpdate(
  id: string,
  input: AdminGoalUpdateInput,
): Promise<AdminGoalUpdate> {
  const [row] = await db
    .update(donationGoalUpdates)
    .set({ body: input.body })
    .where(eq(donationGoalUpdates.id, id))
    .returning();
  if (!row) throw new ApiError('not_found', 'That update was not found.');
  return toGoalUpdate(row);
}

export async function deleteGoalUpdate(id: string): Promise<{ ok: true }> {
  const [row] = await db
    .delete(donationGoalUpdates)
    .where(eq(donationGoalUpdates.id, id))
    .returning({ id: donationGoalUpdates.id });
  if (!row) throw new ApiError('not_found', 'That update was not found.');
  return { ok: true };
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
function donationAdminWhere(params: { status?: DonationExportStatus; q?: string }) {
  const term = params.q
    ?.trim()
    .slice(0, 100)
    .replace(/[\\%_]/g, '\\$&');
  return and(
    params.status ? eq(donations.status, params.status) : undefined,
    term
      ? or(ilike(donations.id, `%${term}%`), ilike(donations.gatewayRef, `%${term}%`))
      : undefined,
  );
}

export async function listDonationsForExport(
  params: { status?: DonationExportStatus; q?: string } = {},
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
    .where(donationAdminWhere(params))
    .orderBy(desc(donations.createdAt), desc(donations.id))
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

export type { AdminGivingMonth };

export interface AdminGivingSummary {
  raisedMinor: number;
  gifts: number;
  thisMonthMinor: number;
  thisMonthGifts: number;
  pendingDonations: number;
  failedDonations: number;
  months: AdminGivingMonth[];
}

/** Confirmed payments only; editable goal targets and pending checkouts are not gifts. */
export async function getAdminGivingSummary(now = new Date()): Promise<AdminGivingSummary> {
  // Include the current month and five preceding calendar months. The local calendar boundary
  // is converted to a timestamptz in SQL so grouping follows the configured site timezone.
  // Interpolate ISO strings, not Date objects: a Date sent as a raw sql-template parameter
  // reaches postgres.js's bind phase unserialised and fails with "Received an instance of Date".
  const nowIso = now.toISOString();
  const firstVisibleMonth = sql`((date_trunc('month', ${nowIso}::timestamptz at time zone ${config.timeZone}) - interval '5 months') at time zone ${config.timeZone})`;

  const [totals, monthly] = await Promise.all([
    db
      .select({
        raisedMinor: sql<string>`coalesce(sum(${donations.amountMinor}) filter (where ${donations.status} = 'succeeded'), 0)::text`,
        gifts: sql<number>`count(*) filter (where ${donations.status} = 'succeeded')::int`,
        pendingDonations: sql<number>`count(*) filter (where ${donations.status} = 'pending')::int`,
        failedDonations: sql<number>`count(*) filter (where ${donations.status} = 'failed')::int`,
      })
      .from(donations),
    db
      .select({
        key: sql<string>`to_char(${donations.succeededAt} at time zone ${config.timeZone}, 'YYYY-MM')`,
        raisedMinor: sql<string>`coalesce(sum(${donations.amountMinor}), 0)::text`,
        gifts: sql<number>`count(*)::int`,
      })
      .from(donations)
      .where(
        and(
          eq(donations.status, 'succeeded'),
          gte(donations.succeededAt, firstVisibleMonth),
          sql`${donations.succeededAt} <= ${nowIso}`,
        ),
      )
      // Group by the first output column positionally, not by a copied expression: drizzle
      // emits separate parameter placeholders for each template, and Postgres must treat
      // GROUP BY's expression as *the same* one the SELECT uses to accept it.
      .groupBy(sql`1`),
  ]);

  const months = buildGivingMonths(monthly, now);
  const row = totals[0];
  const currentMonth = months[months.length - 1]?.key;
  const current = months.find((item) => item.key === currentMonth);

  return {
    raisedMinor: Number(row?.raisedMinor ?? 0),
    gifts: Number(row?.gifts ?? 0),
    thisMonthMinor: current?.raisedMinor ?? 0,
    thisMonthGifts: current?.gifts ?? 0,
    pendingDonations: Number(row?.pendingDonations ?? 0),
    failedDonations: Number(row?.failedDonations ?? 0),
    months,
  };
}

export async function listDonationsForAdmin(
  params: { page?: number; pageSize?: number; status?: DonationExportStatus; q?: string } = {},
) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    config.pagination.maxPageSize,
    Math.max(1, params.pageSize ?? DONATION_PAGE_SIZE),
  );
  const where = donationAdminWhere(params);
  const [totalRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(donations)
    .where(where);
  const total = Number(totalRow?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = await db
    .select({
      id: donations.id,
      amountMinor: donations.amountMinor,
      currency: donations.currency,
      method: donations.method,
      status: donations.status,
      anonymous: donations.anonymous,
      goalId: donations.goalId,
      goalTitle: donationGoals.title,
      tribute: donations.tribute,
      createdAt: donations.createdAt,
    })
    .from(donations)
    .leftJoin(donationGoals, eq(donations.goalId, donationGoals.id))
    .where(where)
    .orderBy(desc(donations.createdAt), desc(donations.id))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return {
    items: rows.map((row) => ({
      id: row.id,
      amountMinor: Number(row.amountMinor),
      currency: row.currency,
      method: row.method,
      status: row.status,
      anonymous: row.anonymous,
      goalId: row.goalId,
      goalTitle: row.goalTitle,
      tribute: row.tribute ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page: currentPage,
    pageSize,
  };
}

/* ------------------------------------------------------------------ */
/* Funds breakdown                                                    */
/* ------------------------------------------------------------------ */

function toAdminFund(row: typeof fundsBreakdown.$inferSelect): AdminFundRow {
  return {
    id: row.id,
    category: row.category,
    sharePercent: row.sharePercent,
    period: row.period,
    sortOrder: row.sortOrder,
  };
}

export async function listFundsForAdmin(): Promise<AdminFundRow[]> {
  const rows = await db.select().from(fundsBreakdown).orderBy(asc(fundsBreakdown.sortOrder));
  return rows.map(toAdminFund);
}

/**
 * Percentages must never add up to more than the whole. Leaving a gap is allowed: the
 * transparency page shows the remainder as unallocated until every row is filled in.
 */
async function assertShareBudget(sharePercent: number, exceptId?: string) {
  const rows = await db
    .select({ id: fundsBreakdown.id, sharePercent: fundsBreakdown.sharePercent })
    .from(fundsBreakdown);
  const used = rows
    .filter((row) => row.id !== exceptId)
    .reduce((sum, row) => sum + row.sharePercent, 0);
  if (used + sharePercent > 100) {
    throw new ApiError(
      'conflict',
      `The shares would add up to ${used + sharePercent}%. Leave room for the remaining categories.`,
    );
  }
}

export async function createFundRow(input: AdminFundInput): Promise<AdminFundRow> {
  await assertShareBudget(input.sharePercent);
  const [row] = await db
    .insert(fundsBreakdown)
    .values({
      id: `fund-${crypto.randomUUID()}`,
      category: input.category,
      sharePercent: input.sharePercent,
      period: input.period || 'current',
      sortOrder: input.sortOrder,
    })
    .returning();
  if (!row) throw new ApiError('server', 'The fund category could not be saved.');
  return toAdminFund(row);
}

export async function updateFundRow(id: string, input: AdminFundInput): Promise<AdminFundRow> {
  await assertShareBudget(input.sharePercent, id);
  const [row] = await db
    .update(fundsBreakdown)
    .set({
      category: input.category,
      sharePercent: input.sharePercent,
      period: input.period || 'current',
      sortOrder: input.sortOrder,
    })
    .where(eq(fundsBreakdown.id, id))
    .returning();
  if (!row) throw new ApiError('not_found', 'That fund category was not found.');
  return toAdminFund(row);
}

export async function deleteFundRow(id: string): Promise<{ ok: true }> {
  const [row] = await db
    .delete(fundsBreakdown)
    .where(eq(fundsBreakdown.id, id))
    .returning({ id: fundsBreakdown.id });
  if (!row) throw new ApiError('not_found', 'That fund category was not found.');
  return { ok: true };
}

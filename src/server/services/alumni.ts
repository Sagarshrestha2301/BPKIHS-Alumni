import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { ApiError } from '@/lib/api/errors';
import { isListable, toPublicView, type Viewer } from '@/lib/api/privacy';
import { buildAlumniFilterOptions, queryAlumni } from '@/lib/api/queries';
import type { AlumniFilterOptions, AlumniListParams, Alumnus, Paginated } from '@/lib/api/types';

import { config } from '../config';
import { db } from '../db/client';
import { alumni, user } from '../db/schema';

type AlumniRow = typeof alumni.$inferSelect;

export function toAlumnus(row: AlumniRow): Alumnus {
  return {
    id: row.id,
    fullName: row.fullName,
    programme: row.programme,
    batchYear: row.batchYear,
    ...(row.furtherStudies ? { furtherStudies: row.furtherStudies } : {}),
    ...(row.currentPosition ? { currentPosition: row.currentPosition } : {}),
    ...(row.organisation ? { organisation: row.organisation } : {}),
    ...(row.city ? { city: row.city } : {}),
    country: row.country,
    ...(row.note ? { note: row.note } : {}),
    ...(row.photoUrl ? { photoUrl: row.photoUrl } : {}),
    ...(row.email ? { email: row.email } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
    privacy: {
      email: row.privacyEmail,
      phone: row.privacyPhone,
      profile: row.privacyProfile,
    },
    status: row.status,
    source: row.source,
    placeholder: row.placeholder,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * The directory is small enough (hundreds of records, never millions) to page in Postgres
 * but filter with the same pure helpers used by the directory UI. That keeps the list,
 * the filters and the profile page consistent, including accent-insensitive search.
 */
async function listableAlumni(viewer: Viewer): Promise<Alumnus[]> {
  const rows = await db
    .select()
    .from(alumni)
    .where(
      and(
        eq(alumni.status, 'approved'),
        viewer.isAlumnus ? undefined : eq(alumni.privacyProfile, 'public'),
      ),
    )
    .orderBy(asc(alumni.fullName));

  return rows.map(toAlumnus).filter((person) => isListable(person, viewer));
}

export async function listAlumni(
  params: AlumniListParams = {},
  viewer: Viewer,
): Promise<Paginated<Alumnus>> {
  const page = queryAlumni(await listableAlumni(viewer), params);
  return { ...page, items: page.items.map((person) => toPublicView(person, viewer)) };
}

export async function getAlumnus(id: string, viewer: Viewer): Promise<Alumnus> {
  const [row] = await db.select().from(alumni).where(eq(alumni.id, id));
  if (!row) throw new ApiError('not_found', 'That profile was not found.');

  const person = toAlumnus(row);
  if (!isListable(person, viewer)) {
    throw new ApiError('not_found', 'That profile was not found.');
  }
  return toPublicView(person, viewer);
}

export async function getAlumniFilterOptions(viewer: Viewer): Promise<AlumniFilterOptions> {
  return buildAlumniFilterOptions(await listableAlumni(viewer));
}

/* ------------------------------------------------------------------ */
/* Admin                                                              */
/* ------------------------------------------------------------------ */

export interface AdminAlumniParams {
  status?: 'pending' | 'approved' | 'rejected';
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listAlumniForAdmin(params: AdminAlumniParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    config.pagination.maxPageSize,
    Math.max(1, params.pageSize ?? config.pagination.adminPageSize),
  );
  const term = params.q?.trim();

  const filters = [
    params.status ? eq(alumni.status, params.status) : undefined,
    term
      ? or(
          ilike(alumni.fullName, `%${term}%`),
          ilike(alumni.email, `%${term}%`),
          ilike(alumni.country, `%${term}%`),
        )
      : undefined,
  ].filter(Boolean);

  const where = filters.length ? and(...filters) : undefined;
  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(alumni)
      .where(where)
      .orderBy(desc(alumni.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(alumni)
      .where(where),
  ]);

  return {
    items: rows.map((row) => ({
      ...toAlumnus(row),
      email: row.email,
      phone: row.phone ?? undefined,
    })),
    total: Number(totalRows[0]?.value ?? 0),
    page,
    pageSize,
  };
}

export async function approveAlumnus(id: string, adminId: string) {
  const [record] = await db
    .select({
      status: alumni.status,
      source: alumni.source,
      userId: alumni.userId,
      emailVerified: user.emailVerified,
    })
    .from(alumni)
    .leftJoin(user, eq(user.id, alumni.userId))
    .where(eq(alumni.id, id));
  if (!record) throw new ApiError('not_found', 'That registration was not found.');

  // A self-registration is only publishable once its owner proved they read that inbox.
  if (record.source === 'self_registered' && record.userId && !record.emailVerified) {
    throw new ApiError(
      'conflict',
      'This member has not confirmed their email address yet. Approve once they have.',
    );
  }

  const [row] = await db
    .update(alumni)
    .set({ status: 'approved', approvedAt: new Date(), approvedBy: adminId, updatedAt: new Date() })
    .where(eq(alumni.id, id))
    .returning({ id: alumni.id });
  if (!row) throw new ApiError('not_found', 'That registration was not found.');
  return { ok: true as const };
}

export async function rejectAlumnus(id: string, reason: string, adminId: string) {
  const [row] = await db
    .update(alumni)
    .set({
      status: 'rejected',
      rejectionReason: reason,
      approvedAt: null,
      approvedBy: adminId,
      updatedAt: new Date(),
    })
    .where(eq(alumni.id, id))
    .returning({ id: alumni.id });
  if (!row) throw new ApiError('not_found', 'That registration was not found.');
  return { ok: true as const };
}

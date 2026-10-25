import { asc, eq } from 'drizzle-orm';

import type { AdminBoardMember } from '@/lib/api/admin';
import type { AdminBoardInput } from '@/lib/api/admin-schemas';
import { ApiError } from '@/lib/api/errors';
import type { BoardMember } from '@/lib/api/types';

import { db } from '../db/client';
import { boardMembers } from '../db/schema';

type BoardRow = typeof boardMembers.$inferSelect;

function optional(value: string | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

function toBoardMember(row: BoardRow): BoardMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    term: row.term,
    ...(row.batch ? { batch: row.batch } : {}),
    ...(row.photoUrl ? { photoUrl: row.photoUrl } : {}),
    ...(row.bio ? { bio: row.bio } : {}),
    ...(row.visionStatement ? { visionStatement: row.visionStatement } : {}),
    isCurrent: row.isCurrent,
    placeholder: row.placeholder,
  };
}

function toAdminBoardMember(row: BoardRow): AdminBoardMember {
  return { ...toBoardMember(row), sortOrder: row.sortOrder };
}

export async function listBoard(params: { current: boolean }): Promise<BoardMember[]> {
  const rows = await db
    .select()
    .from(boardMembers)
    .where(eq(boardMembers.isCurrent, params.current))
    .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.name));

  return rows.map(toBoardMember);
}

/* ------------------------------------------------------------------ */
/* Admin                                                              */
/* ------------------------------------------------------------------ */

export async function listBoardForAdmin(): Promise<AdminBoardMember[]> {
  const rows = await db
    .select()
    .from(boardMembers)
    .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.name));

  return rows.map(toAdminBoardMember);
}

function values(input: AdminBoardInput) {
  return {
    name: input.name,
    role: input.role,
    term: input.term,
    batch: optional(input.batch),
    photoUrl: optional(input.photoUrl),
    bio: optional(input.bio),
    visionStatement: optional(input.visionStatement),
    isCurrent: input.isCurrent,
    sortOrder: input.sortOrder,
  };
}

export async function createBoardMember(input: AdminBoardInput): Promise<AdminBoardMember> {
  const [row] = await db
    .insert(boardMembers)
    .values({ id: `board-${crypto.randomUUID()}`, ...values(input) })
    .returning();
  if (!row) throw new ApiError('server', 'The board member could not be saved.');
  return toAdminBoardMember(row);
}

export async function updateBoardMember(
  id: string,
  input: AdminBoardInput,
): Promise<AdminBoardMember> {
  const [row] = await db
    .update(boardMembers)
    .set(values(input))
    .where(eq(boardMembers.id, id))
    .returning();
  if (!row) throw new ApiError('not_found', 'That board member was not found.');
  return toAdminBoardMember(row);
}

export async function deleteBoardMember(id: string): Promise<{ ok: true }> {
  const [row] = await db
    .delete(boardMembers)
    .where(eq(boardMembers.id, id))
    .returning({ id: boardMembers.id });
  if (!row) throw new ApiError('not_found', 'That board member was not found.');
  return { ok: true };
}

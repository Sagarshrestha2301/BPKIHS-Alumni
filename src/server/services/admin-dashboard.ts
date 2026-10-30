import { and, gte, sql } from 'drizzle-orm';

import { config } from '../config';
import { db } from '../db/client';
import { alumni } from '../db/schema';
import { buildMonthWindow } from './donation-summary';

export interface RegistrationMonth {
  key: string;
  label: string;
  /** Profiles added this month, from the register import and self-registration alike. */
  added: number;
  /** How many of those are still waiting for a decision. */
  pending: number;
}

/**
 * Profiles added per local calendar month over the same six-month window as the giving chart.
 *
 * Imported register rows count too: the Association still has to review them, and leaving
 * them out would show a quiet month while a thousand-row upload sat unprocessed.
 */
export async function getRegistrationMonths(now = new Date()): Promise<RegistrationMonth[]> {
  const nowIso = now.toISOString();
  const firstVisibleMonth = sql`((date_trunc('month', ${nowIso}::timestamptz at time zone ${config.timeZone}) - interval '5 months') at time zone ${config.timeZone})`;

  const rows = await db
    .select({
      key: sql<string>`to_char(${alumni.createdAt} at time zone ${config.timeZone}, 'YYYY-MM')`,
      added: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${alumni.status} = 'pending')::int`,
    })
    .from(alumni)
    .where(and(gte(alumni.createdAt, firstVisibleMonth), sql`${alumni.createdAt} <= ${nowIso}`))
    // Positional, so Postgres treats the grouped expression as the one the SELECT uses.
    .groupBy(sql`1`);

  const byMonth = new Map(rows.map((row) => [row.key, row]));

  return buildMonthWindow(now).map(({ key, label }) => ({
    key,
    label,
    added: Number(byMonth.get(key)?.added ?? 0),
    pending: Number(byMonth.get(key)?.pending ?? 0),
  }));
}

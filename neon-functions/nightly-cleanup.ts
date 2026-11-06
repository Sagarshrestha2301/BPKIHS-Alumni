/**
 * Neon Function: nightly cleanup and daily report for the BPKIHS Alumni app.
 *
 * Runs every morning at 09:15 Nepal time (NPT = UTC+5:45), i.e. 03:30 UTC, via the
 * `nightly-cleanup` schedule trigger declared in `neon.ts`. Authenticated trigger
 * deliveries only: `parseTriggerDelivery` rejects anything that is not a valid
 * Neon trigger POST, so calls from a curl or a browser get a 401.
 *
 * Cleanup — all three are reversals the office already expects, not user content:
 * - Better Auth `session` rows past `expires_at` (stolen-cookie hygiene: nothing rereads them);
 * - Better Auth `verification` rows past `expires_at` (hashed registration OTPs pile up here);
 * - newsletter subscribers still `pending` after 3 days (never opened the confirmation mail);
 * - donations still `pending` after 7 days are marked `failed` (abandoned gateway checkout).
 *
 * Report — one operational snapshot that lands in the Function's logs, useful as the
 * morning glance before opening the admin dashboard.
 */
import { parseEnv } from '@neon/env';
import { parseTriggerDelivery } from '@neon/functions/triggers';
import postgres from 'postgres';

import config from '../neon';

// The pooled URL is the right one for serverless Functions; `prepare: false` matches
// the app client because the pooler drops prepared statements. `onerror` swallows an
// idle-connection drop, which would otherwise surface as an uncaught exception after
// the Function is suspended between runs.
const { postgres: postgresEnv } = parseEnv(config, ['DATABASE_URL']);
const sql = postgres(postgresEnv.databaseUrl, {
  max: 2,
  idle_timeout: 10,
  connect_timeout: 10,
  prepare: false,
});

interface CleanupResult {
  expiredSessions: number;
  expiredVerifications: number;
  unconfirmedSubscribers: number;
  stalePendingDonations: number;
}

async function cleanup(): Promise<CleanupResult> {
  // Sequenced, not parallel: one pooled connection per statement keeps the isolate's
  // footprint tiny, and each statement is sub-millisecond on this dataset.
  const expiredSessions = await sql`
    DELETE FROM "session" WHERE expires_at < now() RETURNING 1
  `;
  const expiredVerifications = await sql`
    DELETE FROM "verification" WHERE expires_at < now() RETURNING 1
  `;
  const unconfirmedSubscribers = await sql`
    DELETE FROM "newsletter_subscribers"
    WHERE status = 'pending' AND created_at < now() - interval '3 days'
    RETURNING 1
  `;
  const stalePendingDonations = await sql`
    UPDATE "donations" SET status = 'failed', updated_at = now()
    WHERE status = 'pending' AND created_at < now() - interval '7 days'
    RETURNING 1
  `;
  return {
    expiredSessions: expiredSessions.length,
    expiredVerifications: expiredVerifications.length,
    unconfirmedSubscribers: unconfirmedSubscribers.length,
    stalePendingDonations: stalePendingDonations.length,
  };
}

interface ReportRow {
  users: number;
  usersUnverified: number;
  usersTwoFactor: number;
  alumniApproved: number;
  alumniPending: number;
  eventsUpcoming: number;
  feedPostsPending: number;
  ticketsOpen: number;
  reportsOpen: number;
  subscribers: number;
  donationsPending: number;
  donationsSucceeded30d: number;
  donatedLast30dMinor: number;
}

async function report(): Promise<ReportRow> {
  const rows = await sql<ReportRow[]>`
    SELECT
      (SELECT COUNT(*) FROM "user") AS "users",
      (SELECT COUNT(*) FROM "user" WHERE NOT email_verified) AS "usersUnverified",
      (SELECT COUNT(*) FROM "user" WHERE two_factor_enabled) AS "usersTwoFactor",
      (SELECT COUNT(*) FROM "alumni" WHERE status = 'approved') AS "alumniApproved",
      (SELECT COUNT(*) FROM "alumni" WHERE status = 'pending') AS "alumniPending",
      (SELECT COUNT(*) FROM "events" WHERE status = 'upcoming') AS "eventsUpcoming",
      (SELECT COUNT(*) FROM "feed_posts" WHERE status = 'pending') AS "feedPostsPending",
      (SELECT COUNT(*) FROM "support_tickets" WHERE status IN ('open', 'in_progress')) AS "ticketsOpen",
      (SELECT COUNT(*) FROM "post_reports" WHERE status = 'open') AS "reportsOpen",
      (SELECT COUNT(*) FROM "newsletter_subscribers" WHERE status = 'subscribed') AS "subscribers",
      (SELECT COUNT(*) FROM "donations" WHERE status = 'pending') AS "donationsPending",
      (SELECT COUNT(*) FROM "donations" WHERE status = 'succeeded' AND succeeded_at >= now() - interval '30 days') AS "donationsSucceeded30d",
      (SELECT COALESCE(SUM(amount_minor), 0) FROM "donations" WHERE status = 'succeeded' AND succeeded_at >= now() - interval '30 days') AS "donatedLast30dMinor"
  `;
  return rows[0]!;
}

function formatNpr(minor: number): string {
  const npr = Number(minor) / 100;
  return npr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const parsed = await parseTriggerDelivery(request);
    if (!parsed.ok) {
      return new Response(parsed.error, { status: parsed.error === 'invalid_body' ? 400 : 401 });
    }

    try {
      const cleanupResult = await cleanup();
      const reportResult = await report();
      const ranAt = new Date().toISOString();

      const summary = [
        `nightly-ok ${ranAt}`,
        `sessions ${cleanupResult.expiredSessions}`,
        `verifications ${cleanupResult.expiredVerifications}`,
        `subs ${cleanupResult.unconfirmedSubscribers}`,
        `stale-donations ${cleanupResult.stalePendingDonations}`,
        `alumni ${reportResult.alumniApproved}/${reportResult.alumniPending}`,
        `tickets ${reportResult.ticketsOpen}`,
        `subscribers ${reportResult.subscribers}`,
        `donated-30d NPR ${formatNpr(reportResult.donatedLast30dMinor)}`,
      ].join(' ');

      // The one line to grep for in the Function's logs the next morning.
      console.log(`[${parsed.invocation.trigger.name}] ${summary}`);

      return Response.json({
        ok: true,
        ranAt,
        cleanup: cleanupResult,
        report: reportResult,
        summary,
      });
    } catch (error) {
      console.error('[nightly-cleanup] run failed', error);
      return Response.json(
        { ok: false, error: error instanceof Error ? error.message : 'run failed' },
        { status: 500 },
      );
    } finally {
      sql.end({ timeout: 5 }).catch(() => {});
    }
  },
};

import { NextResponse } from 'next/server';

import { ApiError } from '@/lib/api/errors';
import { toCsv } from '@/lib/format/csv';
import { requireAdminRead } from '@/server/http/admin-guard';
import { handle } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { DONATION_STATUSES, listDonationsForExport } from '@/server/services/donations';

/**
 * The donation ledger as a CSV file, for reconciliation against the bank statement.
 *
 * Admin-only and rate limited. The export is audited because it contains the giving ledger.
 * Optional `status` and `q` parameters keep the download aligned with the on-screen filters.
 */
const HEADERS = ['reference', 'amount_npr', 'method', 'status', 'goal', 'recorded'] as const;

export async function GET(request: Request) {
  return handle(async () => {
    const session = await requireAdminRead(request);

    const params = new URL(request.url).searchParams;
    const requested = params.get('status');
    const status = DONATION_STATUSES.find((value) => value === requested);
    if (requested && !status) {
      throw new ApiError('validation', 'status must be pending, succeeded or failed.');
    }
    const query = params.get('q')?.trim().slice(0, 100);

    const rows = await listDonationsForExport({ status, q: query });
    const body = toCsv(
      HEADERS,
      rows.map((row) => [row.id, row.amountNpr, row.method, row.status, row.goal, row.recordedAt]),
    );

    try {
      await writeAudit({
        actorId: session.user.id,
        action: 'donations.export',
        entity: 'donation',
        detail: { rows: rows.length, status: status ?? 'all', filteredByReference: Boolean(query) },
      });
    } catch (error) {
      // An audit failure must not cost the admin the file they asked for.
      console.error('[admin] donation export could not be audited', error);
    }

    const filename = `donations-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  });
}

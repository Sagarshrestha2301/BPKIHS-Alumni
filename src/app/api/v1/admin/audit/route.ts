import { desc } from 'drizzle-orm';

import { db } from '@/server/db/client';
import { adminAuditLog } from '@/server/db/schema';
import { requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, pageSizeParam } from '@/server/http/respond';

/** The most recent admin actions, newest first. Read-only. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    const limit = pageSizeParam(new URL(request.url).searchParams.get('pageSize')) ?? 50;
    const rows = await db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(Math.min(limit, 200));

    return ok(
      rows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        detail: row.detail,
        createdAt: row.createdAt.toISOString(),
      })),
    );
  });
}

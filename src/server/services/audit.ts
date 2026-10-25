import { db } from '../db/client';
import { adminAuditLog } from '../db/schema';

export async function writeAudit(input: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(adminAuditLog).values({
    id: crypto.randomUUID(),
    actorId: input.actorId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    detail: input.detail ?? null,
  });
}

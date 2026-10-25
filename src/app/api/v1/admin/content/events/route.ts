import { adminEventInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation, requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { createEvent, listEventsForAdmin } from '@/server/services/events';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    return ok(await listEventsForAdmin());
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, adminEventInputSchema);
    const event = await createEvent(input);
    await writeAudit({
      actorId: session.user.id,
      action: 'create',
      entity: 'event',
      entityId: event.id,
      detail: { slug: event.slug },
    });
    return ok(event, 201);
  });
}

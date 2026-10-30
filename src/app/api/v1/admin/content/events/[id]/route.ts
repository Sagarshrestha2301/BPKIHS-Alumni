import { adminEventInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { deleteEvent, updateEvent } from '@/server/services/events';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const input = await parseBody(request, adminEventInputSchema);
    const event = await updateEvent(id, input);
    await writeAudit({
      actorId: session.user.id,
      action: 'update',
      entity: 'event',
      entityId: event.id,
      detail: { slug: event.slug },
    });
    return ok(event);
  });
}

export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const eventId = id;
    const result = await deleteEvent(eventId);
    await writeAudit({
      actorId: session.user.id,
      action: 'delete',
      entity: 'event',
      entityId: eventId,
    });
    return ok(result);
  });
}

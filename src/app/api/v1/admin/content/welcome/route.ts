import { adminWelcomeInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation, requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { getWelcomeMessageForAdmin, saveWelcomeMessage } from '@/server/services/content';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    return ok(await getWelcomeMessageForAdmin());
  });
}

export async function PUT(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, adminWelcomeInputSchema);
    const message = await saveWelcomeMessage(input);
    await writeAudit({
      actorId: session.user.id,
      action: 'update',
      entity: 'welcome_message',
      entityId: 'default',
      detail: { author: message.author },
    });
    return ok(message);
  });
}

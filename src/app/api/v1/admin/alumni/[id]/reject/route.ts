import { z } from 'zod';

import { emailCopy } from '@/content/email';
import { revalidateDirectory } from '@/server/cache';
import { sendEmailSafely } from '@/server/email';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { appUrl } from '@/server/http/app-url';
import { handle, ok, parseBody } from '@/server/http/respond';
import { rejectAlumnus } from '@/server/services/alumni';
import { writeAudit } from '@/server/services/audit';

const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'Give a short reason.').max(500),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const { reason } = await parseBody(request, rejectSchema);
    const result = await rejectAlumnus(id, reason, session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action: 'reject',
      entity: 'alumni',
      entityId: id,
      detail: { reason },
    });
    revalidateDirectory();

    // The reason stays in the dashboard and audit log; the email only points the member at
    // their account, where the wording can be read in context and corrected. Imported rows
    // without an account are never emailed.
    if (result.member.notify) {
      await sendEmailSafely({
        to: result.member.email,
        ...emailCopy.alumniRejected({
          name: result.member.fullName,
          accountUrl: `${appUrl()}/account`,
        }),
      });
    }

    return ok(result);
  });
}

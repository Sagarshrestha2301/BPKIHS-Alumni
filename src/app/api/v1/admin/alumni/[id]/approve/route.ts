import { emailCopy } from '@/content/email';
import { revalidateDirectory } from '@/server/cache';
import { sendEmailSafely } from '@/server/email';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { appUrl } from '@/server/http/app-url';
import { handle, ok } from '@/server/http/respond';
import { approveAlumnus } from '@/server/services/alumni';
import { writeAudit } from '@/server/services/audit';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const result = await approveAlumnus(id, session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action: 'approve',
      entity: 'alumni',
      entityId: id,
    });
    revalidateDirectory();

    // Email is a notification, not part of the decision: a failed send never undoes an
    // approval. Imported register rows have no account, so they are never emailed.
    if (result.member.notify) {
      await sendEmailSafely({
        to: result.member.email,
        ...emailCopy.alumniApproved({
          name: result.member.fullName,
          accountUrl: `${appUrl()}/account`,
        }),
      });
    }

    return ok(result);
  });
}

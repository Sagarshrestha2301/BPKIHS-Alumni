import { adminPostInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation, requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { createStaffPost, listPendingPosts } from '@/server/services/community';

/** The moderation queue: every member submission still waiting for a decision. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    return ok(await listPendingPosts());
  });
}

/** A staff post is written already published, so it needs no second review. */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, adminPostInputSchema);
    const post = await createStaffPost(input, session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action: 'create',
      entity: 'post',
      entityId: post.id,
      detail: { title: post.title, type: post.type },
    });
    return ok(post, 201);
  });
}

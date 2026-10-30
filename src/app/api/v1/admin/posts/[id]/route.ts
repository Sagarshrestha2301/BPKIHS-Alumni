import { adminPostInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { deleteStaffPost, updateStaffPost } from '@/server/services/community';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const input = await parseBody(request, adminPostInputSchema);
    const post = await updateStaffPost(id, input, session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action: 'update',
      entity: 'post',
      entityId: post.id,
      detail: { title: post.title },
    });
    return ok(post);
  });
}

export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const postId = id;
    const result = await deleteStaffPost(postId);
    await writeAudit({
      actorId: session.user.id,
      action: 'delete',
      entity: 'post',
      entityId: postId,
    });
    return ok(result);
  });
}

import { newsletterCampaignInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation, requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, pageParam, pageSizeParam, parseBody } from '@/server/http/respond';
import { listCampaigns, listSubscribersForAdmin, sendCampaign } from '@/server/services/newsletter';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    const params = new URL(request.url).searchParams;
    const status = params.get('status');
    const [subscribers, campaigns] = await Promise.all([
      listSubscribersForAdmin({
        page: pageParam(params.get('page')),
        pageSize: pageSizeParam(params.get('pageSize')),
        q: params.get('q') ?? undefined,
        status:
          status === 'subscribed' || status === 'unsubscribed' || status === 'pending'
            ? status
            : undefined,
      }),
      listCampaigns(),
    ]);
    return ok({ subscribers, campaigns });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, newsletterCampaignInputSchema);
    const result = await sendCampaign(input, session.user.id);
    return ok(result);
  });
}

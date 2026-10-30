import { requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok } from '@/server/http/respond';
import { getWelcomeMessageForAdmin, listFaqForAdmin } from '@/server/services/content';
import { listFundsForAdmin, listGoalsForAdmin } from '@/server/services/donations';
import { listEventsForAdmin } from '@/server/services/events';
import { listBoardForAdmin } from '@/server/services/governance';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    const [events, goals, board, faq, welcome, funds] = await Promise.all([
      listEventsForAdmin(),
      listGoalsForAdmin(),
      listBoardForAdmin(),
      listFaqForAdmin(),
      getWelcomeMessageForAdmin(),
      listFundsForAdmin(),
    ]);
    return ok({ events, goals, board, faq, welcome, funds });
  });
}

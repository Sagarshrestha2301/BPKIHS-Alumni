import type { Metadata } from 'next';

import { adminContentPage } from '@/content/admin-content';
import { ContentManager } from '@/features/admin/content/content-manager';
import { requireAdminPage } from '@/server/auth/admin-page';
import { getWelcomeMessageForAdmin, listFaqForAdmin } from '@/server/services/content';
import {
  listFundsForAdmin,
  listGoalsForAdmin,
  listGoalUpdatesForAdmin,
} from '@/server/services/donations';
import { listEventsForAdmin } from '@/server/services/events';
import { listBoardForAdmin } from '@/server/services/governance';

export const metadata: Metadata = { title: adminContentPage.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

export default async function AdminContentPage() {
  await requireAdminPage();

  const [events, goals, updates, board, faq, welcome, funds] = await Promise.all([
    listEventsForAdmin(),
    listGoalsForAdmin(),
    listGoalUpdatesForAdmin(),
    listBoardForAdmin(),
    listFaqForAdmin(),
    getWelcomeMessageForAdmin(),
    listFundsForAdmin(),
  ]);

  return <ContentManager initial={{ events, goals, updates, board, faq, welcome, funds }} />;
}

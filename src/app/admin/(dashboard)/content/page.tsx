import type { Metadata } from 'next';

import { adminContentPage } from '@/content/admin-content';
import { ContentManager } from '@/features/admin/content/content-manager';
import { requireAdminPage } from '@/server/auth/admin-page';
import { getWelcomeMessageForAdmin, listFaqForAdmin } from '@/server/services/content';
import { listGoalsForAdmin } from '@/server/services/donations';
import { listEventsForAdmin } from '@/server/services/events';
import { listBoardForAdmin } from '@/server/services/governance';

export const metadata: Metadata = { title: adminContentPage.title };

export default async function AdminContentPage() {
  await requireAdminPage();

  const [events, goals, board, faq, welcome] = await Promise.all([
    listEventsForAdmin(),
    listGoalsForAdmin(),
    listBoardForAdmin(),
    listFaqForAdmin(),
    getWelcomeMessageForAdmin(),
  ]);

  return <ContentManager initial={{ events, goals, board, faq, welcome }} />;
}

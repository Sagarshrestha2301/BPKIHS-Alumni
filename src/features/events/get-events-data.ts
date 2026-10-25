import { cacheLife } from 'next/cache';

import type { EventStatus } from '@/lib/constants/domain';
import { getServerApiClient } from '@/server/api/server-client';

export async function getEventsPage(status: EventStatus, q?: string) {
  'use cache';
  cacheLife('hours');
  return getServerApiClient().listEvents({ status, q, pageSize: 50 });
}

export async function getEventBySlug(slug: string) {
  'use cache';
  cacheLife('hours');
  return getServerApiClient().getEvent(slug);
}

export async function getEventGoal(goalId: string | undefined) {
  'use cache';
  cacheLife('hours');
  if (!goalId) return undefined;
  const goals = await getServerApiClient().listGoals();
  return goals.find((goal) => goal.id === goalId);
}

import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';
import type { EventStatus } from '@/lib/constants/domain';

export async function getEventsPage(status: EventStatus, q?: string) {
  'use cache';
  cacheLife('hours');
  return getApiClient().listEvents({ status, q, pageSize: 50 });
}

export async function getEventBySlug(slug: string) {
  'use cache';
  cacheLife('hours');
  return getApiClient().getEvent(slug);
}

export async function getEventGoal(goalId: string | undefined) {
  'use cache';
  cacheLife('hours');
  if (!goalId) return undefined;
  const goals = await getApiClient().listGoals();
  return goals.find((goal) => goal.id === goalId);
}

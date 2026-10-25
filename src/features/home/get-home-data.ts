import { cacheLife } from 'next/cache';

import { pickBoardPreview } from '@/features/governance/pick-board-preview';
import type { PostType } from '@/lib/constants/domain';
import { getServerApiClient } from '@/server/api/server-client';

/** Site-wide numbers for the home page. Same for every visitor, so they are cached. */
export async function getHomeStats() {
  'use cache';
  cacheLife('days');
  return getServerApiClient().getSiteStats();
}

/** The first three giving goals (the general fund comes first in the data). */
export async function getFeaturedGoals() {
  'use cache';
  cacheLife('days');
  const goals = await getServerApiClient().listGoals();
  return goals.slice(0, 3);
}

/** The next three upcoming events, soonest first. */
export async function getUpcomingEvents() {
  'use cache';
  cacheLife('days');
  const page = await getServerApiClient().listEvents({
    status: 'upcoming',
    sort: 'soonest',
    pageSize: 3,
  });
  return page.items;
}

/** Post types shown on the home page. Notices, announcements and In memoriam stay in /community. */
const homePostTypes: readonly PostType[] = ['news', 'story', 'achievement'];

/** The three newest approved posts of the types above. */
export async function getLatestPosts() {
  'use cache';
  cacheLife('days');
  const page = await getServerApiClient().listFeed({ pageSize: 12 });
  return page.items.filter((post) => homePostTypes.includes(post.type)).slice(0, 3);
}

/** The president and three more members of the current board. */
export async function getBoardPreview() {
  'use cache';
  cacheLife('days');
  const members = await getServerApiClient().listBoard({ current: true });
  return pickBoardPreview(members);
}

export async function getWelcome() {
  'use cache';
  cacheLife('days');
  return getServerApiClient().getWelcomeMessage();
}

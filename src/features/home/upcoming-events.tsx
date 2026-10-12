import { getUpcomingEvents } from '@/features/home/get-home-data';
import { UpcomingEventsView } from '@/features/home/upcoming-events-view';

export async function UpcomingEvents() {
  const events = await getUpcomingEvents();
  return <UpcomingEventsView events={events} />;
}

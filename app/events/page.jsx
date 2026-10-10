import { getAllEvents } from '@/lib/queries/events';
import EventsListClient from './EventsListClient';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getAllEvents();
  return <EventsListClient initialEvents={events} />;
}

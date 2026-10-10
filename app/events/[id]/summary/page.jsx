import { notFound } from 'next/navigation';
import { getEventSummary } from '@/lib/queries/events';
import SummaryClient from './SummaryClient';

export const dynamic = 'force-dynamic';

export default async function EventSummaryPage({ params }) {
  const { id } = await params;
  const summary = await getEventSummary(id);
  if (!summary.event) notFound();

  return <SummaryClient eventId={id} summary={summary} />;
}

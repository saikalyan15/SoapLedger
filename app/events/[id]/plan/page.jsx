import { notFound } from 'next/navigation';
import { getEventById, getEventInventory, getEventRecommendations } from '@/lib/queries/events';
import PlanInventoryClient from './PlanInventoryClient';

export const dynamic = 'force-dynamic';

export default async function PlanInventoryPage({ params }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const savedInventory = await getEventInventory(id);
  const defaultTarget = savedInventory.length > 0
    ? savedInventory.reduce((sum, r) => sum + r.planned_quantity, 0)
    : 100;
  const recommendations = await getEventRecommendations(id, defaultTarget);

  return (
    <PlanInventoryClient
      event={event}
      initialRecommendations={recommendations}
      savedInventory={savedInventory}
      initialTarget={defaultTarget}
    />
  );
}

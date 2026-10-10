import { notFound } from 'next/navigation';
import { getEventById, getEventInventory, getEventRecommendations, getEventSales } from '@/lib/queries/events';
import { getSettings } from '@/lib/queries/settings';
import PlanInventoryClient from './PlanInventoryClient';

export const dynamic = 'force-dynamic';

export default async function PlanInventoryPage({ params }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const [savedInventory, sales, settings] = await Promise.all([
    getEventInventory(id),
    getEventSales(id),
    getSettings(),
  ]);

  const soldByProduct = {};
  sales.forEach((s) => {
    soldByProduct[s.product_id] = (soldByProduct[s.product_id] || 0) + Number(s.quantity);
  });

  const defaultTargetSetting = parseInt(settings.find((s) => s.key === 'event_default_target_units')?.value || '100');
  const defaultTarget = savedInventory.length > 0
    ? savedInventory.reduce((sum, r) => sum + r.planned_quantity, 0)
    : defaultTargetSetting;

  const recommendations = await getEventRecommendations(id, defaultTarget);

  return (
    <PlanInventoryClient
      event={event}
      initialRecommendations={recommendations}
      savedInventory={savedInventory}
      soldByProduct={soldByProduct}
      initialTarget={defaultTarget}
    />
  );
}

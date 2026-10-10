import { notFound } from 'next/navigation';
import { getEventById, getEventInventory, getEventRecommendations, getEventSales, getEventChecklist } from '@/lib/queries/events';
import { getSettings } from '@/lib/queries/settings';
import { getUnitEconomics } from '@/lib/queries/dashboard';
import PlanInventoryClient from './PlanInventoryClient';

export const dynamic = 'force-dynamic';

export default async function PlanInventoryPage({ params }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const [savedInventory, sales, settings, checklist, unitEconomics] = await Promise.all([
    getEventInventory(id),
    getEventSales(id),
    getSettings(),
    getEventChecklist(id),
    getUnitEconomics(),
  ]);

  const soldByProduct = {};
  sales.forEach((s) => {
    soldByProduct[s.product_id] = (soldByProduct[s.product_id] || 0) + Number(s.quantity);
  });

  // The target only ever governs the Soap category (see getEventRecommendations),
  // so re-deriving it from a saved plan must sum Soap rows only — summing
  // every category would silently inflate it with balm/gift-set quantities.
  const savedSoapInventory = savedInventory.filter((r) => r.product_type === 'Soap');
  const defaultTargetSetting = parseInt(settings.find((s) => s.key === 'event_default_target_units')?.value || '100');
  const defaultTarget = savedSoapInventory.length > 0
    ? savedSoapInventory.reduce((sum, r) => sum + r.planned_quantity, 0)
    : defaultTargetSetting;

  const recommendations = await getEventRecommendations(id, defaultTarget);

  return (
    <PlanInventoryClient
      event={event}
      initialRecommendations={recommendations}
      savedInventory={savedInventory}
      soldByProduct={soldByProduct}
      initialTarget={defaultTarget}
      initialChecklist={checklist}
      productionCostPerSoap={unitEconomics.production_cost_per_soap}
    />
  );
}

import { getAllEssentialOils } from '@/lib/queries/essential_oils';
import InventoryView from './InventoryView';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const oils = await getAllEssentialOils();
  return <InventoryView oils={oils} />;
}

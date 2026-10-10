import { notFound } from 'next/navigation';
import { getEventById, getEventInventory, getEventSales } from '@/lib/queries/events';
import SellClient from './SellClient';

export const dynamic = 'force-dynamic';

export default async function SellPage({ params }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const [inventory, sales] = await Promise.all([
    getEventInventory(id),
    getEventSales(id),
  ]);

  const soldByProduct = {};
  sales.forEach((s) => {
    soldByProduct[s.product_id] = (soldByProduct[s.product_id] || 0) + Number(s.quantity);
  });

  const items = inventory.map((row) => ({
    product_id: row.product_id,
    name: row.name,
    base_type: row.base_type,
    weight_grams: row.weight_grams,
    unit_price: Number(row.unit_price),
    planned_quantity: Number(row.planned_quantity),
    sold_quantity: soldByProduct[row.product_id] || 0,
  }));

  return <SellClient event={event} initialItems={items} />;
}

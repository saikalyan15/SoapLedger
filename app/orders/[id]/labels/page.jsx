import sql from '@/lib/db';
import LabelsClient from './LabelsClient';
import { notFound } from 'next/navigation';

export default async function LabelsPage({ params }) {
  const { id } = await params;

  const data = await sql`
    SELECT 
      o.id,
      o.order_date,
      s.customer_name,
      s.customer_phone,
      s.customer_address,
      oi.quantity,
      p.name as product_name,
      p.base_type,
      p.weight_grams,
      p.ingredients
    FROM orders o
    JOIN order_summary s ON s.id = o.id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.id = ${id}
    ORDER BY p.name
  `;

  if (!data || data.length === 0) {
    notFound();
  }

  // Expand items by quantity
  const labels = data.flatMap(item => {
    const quantity = parseInt(item.quantity) || 0;
    return Array(quantity).fill({
      product_name: item.product_name,
      base_type: item.base_type,
      weight_grams: item.weight_grams,
      ingredients: item.ingredients,
      order_date: item.order_date
    });
  });

  const orderInfo = {
    id: data[0].id,
    customer_name: data[0].customer_name,
    customer_phone: data[0].customer_phone,
    customer_address: data[0].customer_address,
    total_labels: labels.length
  };

  return <LabelsClient labels={labels} orderInfo={orderInfo} />;
}

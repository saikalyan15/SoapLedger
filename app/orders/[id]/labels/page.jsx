import sql from '@/lib/db';
import LabelsClient from './LabelsClient';
import { notFound } from 'next/navigation';
import { getBusinessConfigAction } from '@/lib/actions/settings';

export default async function LabelsPage({ params }) {
  const { id } = await params;

  const [data, businessConfig] = await Promise.all([
    sql`
    SELECT
      o.id,
      s.customer_name,
      s.customer_phone,
      s.customer_address
    FROM orders o
    JOIN order_summary s ON s.id = o.id
    WHERE o.id = ${id}
  `,
    getBusinessConfigAction(),
  ]);

  if (!data || data.length === 0) {
    notFound();
  }

  const orderInfo = {
    id: data[0].id,
    customer_name: data[0].customer_name,
    customer_phone: data[0].customer_phone,
    customer_address: data[0].customer_address,
  };

  return <LabelsClient orderInfo={orderInfo} businessConfig={businessConfig} />;
}

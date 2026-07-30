import { getPendingDispatchShipments } from '@/lib/queries/orders';
import { getBusinessConfigAction } from '@/lib/actions/settings';
import DispatchReportClient from './DispatchReportClient';

export const dynamic = 'force-dynamic';

export default async function DispatchReportPage() {
  const [shipments, businessConfig] = await Promise.all([
    getPendingDispatchShipments(),
    getBusinessConfigAction(),
  ]);

  return <DispatchReportClient shipments={shipments} businessConfig={businessConfig} />;
}

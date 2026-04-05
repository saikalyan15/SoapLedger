import PageHeader from '@/components/PageHeader';
import SkuReportClient from './SkuReportClient';
import { getSkuAllTime, getSkuMonthly } from '@/lib/queries/sku-report';

export const dynamic = 'force-dynamic';

export default async function SkuReportPage() {
  const [allTime, monthly] = await Promise.all([
    getSkuAllTime(),
    getSkuMonthly(),
  ]);

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="SKU Report"
        subtitle="Soap-wise sales numbers to plan your label print strategy"
      />
      <SkuReportClient allTime={allTime} monthly={monthly} />
    </div>
  );
}

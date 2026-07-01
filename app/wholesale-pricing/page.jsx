import PageHeader from '@/components/PageHeader';
import { getWholesalePricingProducts } from '@/lib/queries/wholesale-pricing';
import WholesalePricingClient from './WholesalePricingClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Wholesale Pricing | SoapLedger',
  description: 'Wholesale pricing report for handmade soap products',
};

export default async function WholesalePricingPage() {
  const products = await getWholesalePricingProducts();

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: '1280px', margin: '0 auto' }}>
      <PageHeader
        title="Wholesale Pricing"
        subtitle="Base type pricing by quantity, with a quote builder for interested wholesale enquiries"
      />
      <WholesalePricingClient products={products} />
    </div>
  );
}

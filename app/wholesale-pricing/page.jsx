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
        subtitle="Industry-style MOQ pricing combinations for handmade soap wholesale, private label, and event orders"
      />
      <WholesalePricingClient products={products} />
    </div>
  );
}

import PageHeader from '@/components/PageHeader';
import RepeatCustomersClient from './RepeatCustomersClient';
import { getRepeatCustomers } from '@/lib/queries/repeat-customers';

export const dynamic = 'force-dynamic';

export default async function RepeatCustomersPage() {
  const customers = await getRepeatCustomers();

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: '900px', margin: '0 auto' }}>
      <PageHeader
        title="Repeat Customers"
        subtitle="Customers who've ordered more than once, and what they've bought"
      />
      <RepeatCustomersClient customers={customers} />
    </div>
  );
}

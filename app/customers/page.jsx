import { getAllCustomers } from '@/lib/queries/customers';
import CustomersView from './CustomersView';

export default async function CustomersPage() {
  const customers = await getAllCustomers();

  // Summary stats
  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter(c => parseInt(c.order_count) > 1).length;
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = customers.filter(c => new Date(c.created_at) >= firstDayOfMonth).length;

  const stats = {
    totalCustomers,
    repeatCustomers,
    newThisMonth
  };

  return <CustomersView customers={customers} stats={stats} />;
}

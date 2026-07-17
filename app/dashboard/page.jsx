import {
  getRevenueKPIs,
  getRepeatCustomerRate,
  getProductPerformance,
  getCashFlowTrend,
  getUnitEconomics,
  getTopExpenseCategories,
  getQuietCustomers,
  getThisMonthSnapshot,
  getActionableOrders,
} from '@/lib/queries/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const range = { from: null, to: null };

  const [
    revenue, customers, products, cashFlow, expenseCats,
    snapshot, actionable, quietCustomers, unitEconomics,
  ] = await Promise.all([
    getRevenueKPIs(range),
    getRepeatCustomerRate(range),
    getProductPerformance(range),
    getCashFlowTrend(range),
    getTopExpenseCategories(range),
    getThisMonthSnapshot(),
    getActionableOrders(),
    getQuietCustomers(),
    getUnitEconomics(),
  ]);

  return (
    <div className="dashboard-page" style={{ padding: '40px' }}>
      <DashboardClient
        initialRevenue={revenue}
        initialCustomers={customers}
        initialProducts={products}
        initialCashFlow={cashFlow}
        initialExpenseCats={expenseCats}
        initialSnapshot={snapshot}
        initialActionable={actionable}
        initialQuietCustomers={quietCustomers}
        initialUnitEconomics={unitEconomics}
      />
    </div>
  );
}

import {
  getRevenueKPIs,
  getRepeatCustomerRate,
  getProductPerformance,
  getMonthlyBaseRevenue,
  getCostPriceTrend,
  getMonthlySurplusDeficit,
  getBreakEvenProjection,
  getTopExpenseCategories,
  getQuietCustomers,
  getThisMonthSnapshot,
  getActionableOrders,
  getTopCustomers,
  getRepeatCustomersList,
} from '@/lib/queries/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const range = { from: null, to: null };

  const [
    revenue, customers, products, baseTrend, costTrend,
    profitability, projection, expenseCats,
    snapshot, actionable, topCustomers, repeatCustomers, quietCustomers,
  ] = await Promise.all([
    getRevenueKPIs(range),
    getRepeatCustomerRate(range),
    getProductPerformance(range),
    getMonthlyBaseRevenue(range),
    getCostPriceTrend(range),
    getMonthlySurplusDeficit(),
    getBreakEvenProjection(),
    getTopExpenseCategories(range),
    getThisMonthSnapshot(),
    getActionableOrders(),
    getTopCustomers(),
    getRepeatCustomersList(),
    getQuietCustomers(),
  ]);

  return (
    <div style={{ padding: '40px' }}>
      <DashboardClient
        initialRevenue={revenue}
        initialCustomers={customers}
        initialProducts={products}
        initialBaseTrend={baseTrend}
        initialCostTrend={costTrend}
        initialProfitability={profitability}
        initialProjection={projection}
        initialExpenseCats={expenseCats}
        initialSnapshot={snapshot}
        initialActionable={actionable}
        initialTopCustomers={topCustomers}
        initialRepeatCustomers={repeatCustomers}
        initialQuietCustomers={quietCustomers}
      />
    </div>
  );
}

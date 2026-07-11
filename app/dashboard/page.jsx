import {
  getRevenueKPIs,
  getRepeatCustomerRate,
  getProductPerformance,
  getMonthlyBaseRevenue,
  getCostPriceTrend,
  getMonthlySurplusDeficit,
  getBreakEvenProjection,
  getMonthlyOrderTrend,
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
    profitability, projection, orderTrend,
    snapshot, actionable, topCustomers, repeatCustomers,
  ] = await Promise.all([
    getRevenueKPIs(range),
    getRepeatCustomerRate(range),
    getProductPerformance(range),
    getMonthlyBaseRevenue(range),
    getCostPriceTrend(range),
    getMonthlySurplusDeficit(),
    getBreakEvenProjection(),
    getMonthlyOrderTrend(range),
    getThisMonthSnapshot(),
    getActionableOrders(),
    getTopCustomers(),
    getRepeatCustomersList(),
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
        initialOrderTrend={orderTrend}
        initialSnapshot={snapshot}
        initialActionable={actionable}
        initialTopCustomers={topCustomers}
        initialRepeatCustomers={repeatCustomers}
      />
    </div>
  );
}

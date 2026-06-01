import {
  getRevenueKPIs,
  getRepeatCustomerRate,
  getProductPerformance,
  getCostPriceTrend,
  getMonthlySurplusDeficit,
  getBreakEvenProjection,
  getMonthlyOrderTrend,
  getThisMonthSnapshot,
  getActionableOrders,
  getTopCustomers,
  getReorderCandidates,
} from '@/lib/queries/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const range = { from: null, to: null };

  const [
    revenue, customers, products, costTrend,
    profitability, projection, orderTrend,
    snapshot, actionable, topCustomers, reorderCandidates,
  ] = await Promise.all([
    getRevenueKPIs(range),
    getRepeatCustomerRate(range),
    getProductPerformance(range),
    getCostPriceTrend(range),
    getMonthlySurplusDeficit(),
    getBreakEvenProjection(),
    getMonthlyOrderTrend(range),
    getThisMonthSnapshot(),
    getActionableOrders(),
    getTopCustomers(),
    getReorderCandidates(),
  ]);

  return (
    <div style={{ padding: '40px' }}>
      <DashboardClient
        initialRevenue={revenue}
        initialCustomers={customers}
        initialProducts={products}
        initialCostTrend={costTrend}
        initialProfitability={profitability}
        initialProjection={projection}
        initialOrderTrend={orderTrend}
        initialSnapshot={snapshot}
        initialActionable={actionable}
        initialTopCustomers={topCustomers}
        initialReorderCandidates={reorderCandidates}
      />
    </div>
  );
}

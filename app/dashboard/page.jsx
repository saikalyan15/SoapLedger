import {
  getRevenueKPIs,
  getRepeatCustomerRate,
  getProductPerformance,
  getAvgOrderValueTrend,
  getCostPriceTrend,
  getMonthlySurplusDeficit,
  getBreakEvenProjection,
  getMonthlyProductionData,
  getMonthlyOrderTrend
} from '@/lib/queries/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const range = { from: null, to: null }; // default all time

  const [
    revenue, customers, products, avgTrend, costTrend,
    profitability, projection, production, orderTrend
  ] = await Promise.all([
    getRevenueKPIs(range),
    getRepeatCustomerRate(range),
    getProductPerformance(range),
    getAvgOrderValueTrend(range),
    getCostPriceTrend(range),
    getMonthlySurplusDeficit(),
    getBreakEvenProjection(),
    getMonthlyProductionData(range),
    getMonthlyOrderTrend(range)
  ]);

  return (
    <div style={{ padding: '40px' }}>
      <DashboardClient
        initialRevenue={revenue}
        initialCustomers={customers}
        initialProducts={products}
        initialAvgTrend={avgTrend}
        initialCostTrend={costTrend}
        initialProfitability={profitability}
        initialProjection={projection}
        initialProduction={production}
        initialOrderTrend={orderTrend}
      />
    </div>
  );
}

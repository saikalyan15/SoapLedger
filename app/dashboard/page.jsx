import { 
  getRevenueKPIs, 
  getRepeatCustomerRate, 
  getProductPerformance, 
  getOperationsMetrics, 
  getAvgOrderValueTrend,
  getCostPriceTrend,
  getMonthlySurplusDeficit,
  getBreakEvenProjection,
  getMonthlyProductionData
} from '@/lib/queries/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const range = { from: null, to: null }; // default all time

  const [
    revenue, customers, products, operations, avgTrend, costTrend, 
    profitability, projection, production
  ] = await Promise.all([
    getRevenueKPIs(range),
    getRepeatCustomerRate(range),
    getProductPerformance(range),
    getOperationsMetrics(range),
    getAvgOrderValueTrend(range),
    getCostPriceTrend(range),
    getMonthlySurplusDeficit(),
    getBreakEvenProjection(),
    getMonthlyProductionData(range)
  ]);

  return (
    <div style={{ padding: '40px' }}>
      <DashboardClient
        initialRevenue={revenue}
        initialCustomers={customers}
        initialProducts={products}
        initialOperations={operations}
        initialAvgTrend={avgTrend}
        initialCostTrend={costTrend}
        initialProfitability={profitability}
        initialProjection={projection}
        initialProduction={production}
      />
    </div>
  );
}

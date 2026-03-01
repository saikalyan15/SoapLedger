import { 
  getRevenueKPIs, 
  getMonthlyRevenue, 
  getRepeatCustomerRate, 
  getProductPerformance, 
  getOperationsMetrics, 
  getAvgOrderValueTrend,
  getCostPriceTrend
} from '@/lib/queries/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const range = { from: null, to: null }; // default all time

  const [revenue, monthly, customers, products, operations, avgTrend, costTrend] = await Promise.all([
    getRevenueKPIs(range),
    getMonthlyRevenue(range),
    getRepeatCustomerRate(range),
    getProductPerformance(range),
    getOperationsMetrics(range),
    getAvgOrderValueTrend(range),
    getCostPriceTrend(range)
  ]);

  return (
    <div style={{ padding: '40px' }}>
      <DashboardClient
        initialRevenue={revenue}
        initialMonthly={monthly}
        initialCustomers={customers}
        initialProducts={products}
        initialOperations={operations}
        initialAvgTrend={avgTrend}
        initialCostTrend={costTrend}
      />
    </div>
  );
}

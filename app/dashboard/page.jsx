import fs from 'node:fs';
import path from 'node:path';
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
  getOrdersByLocation,
} from '@/lib/queries/dashboard';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const range = { from: null, to: null };

  const [
    revenue, customers, products, cashFlow, expenseCats,
    snapshot, actionable, quietCustomers, unitEconomics, locations,
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
    getOrdersByLocation(),
  ]);

  const indiaGeo = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'india-states.geojson'), 'utf-8'),
  );

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
        initialLocations={locations}
        indiaGeo={indiaGeo}
      />
    </div>
  );
}

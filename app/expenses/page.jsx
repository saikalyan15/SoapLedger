import ExpensesClient from './ExpensesClient'
import { getCategories, getExpenses, getExpenseSummary, getExpenseMonthlyTrend } from '@/lib/queries/expenses'
import { getUnitEconomics } from '@/lib/queries/dashboard'

export default async function ExpensesPage() {
  const [categories, expenses, summary, monthlyTrend, unitEconomics] = await Promise.all([
    getCategories(),
    getExpenses(),
    getExpenseSummary(),
    getExpenseMonthlyTrend(),
    getUnitEconomics(),
  ])

  return (
    <ExpensesClient
      initialCategories={categories}
      initialExpenses={expenses}
      summary={{ ...summary, cost_price_per_soap: unitEconomics.unit_cost }}
      monthlyTrend={monthlyTrend}
    />
  )
}

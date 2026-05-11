import ExpensesClient from './ExpensesClient'
import { getCategories, getExpenses, getExpenseSummary, getExpenseMonthlyTrend } from '@/lib/queries/expenses'

export default async function ExpensesPage() {
  const [categories, expenses, summary, monthlyTrend] = await Promise.all([
    getCategories(),
    getExpenses(),
    getExpenseSummary(),
    getExpenseMonthlyTrend(),
  ])

  return (
    <ExpensesClient
      initialCategories={categories}
      initialExpenses={expenses}
      summary={summary}
      monthlyTrend={monthlyTrend}
    />
  )
}

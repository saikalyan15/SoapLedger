import ExpensesClient from './ExpensesClient'
import { getCategories, getExpenses, getExpenseSummary } from '@/lib/queries/expenses'

export default async function ExpensesPage() {
  const [categories, expenses, summary] = await Promise.all([
    getCategories(),
    getExpenses(),
    getExpenseSummary(),
  ])
  
  return (
    <ExpensesClient
      initialCategories={categories}
      initialExpenses={expenses}
      summary={summary}
    />
  )
}

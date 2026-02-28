import { getExpenses, getExpenseSummary } from '@/lib/queries/expenses';
import ExpensesView from './ExpensesView';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const [expenses, summary] = await Promise.all([
    getExpenses(),
    getExpenseSummary()
  ]);
  
  return <ExpensesView expenses={expenses} summary={summary} />;
}

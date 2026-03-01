import { getExpenses, getCategories, getExpenseSummary } from '@/lib/queries/expenses';
import ExpensesClient from './ExpensesClient';

export default async function ExpensesPage() {
  const [expenses, categories, summary] = await Promise.all([
    getExpenses(),
    getCategories(),
    getExpenseSummary()
  ]);

  return (
    <div style={{ padding: '40px' }}>
      <ExpensesClient 
        initialExpenses={expenses} 
        initialCategories={categories} 
        initialSummary={summary} 
      />
    </div>
  );
}

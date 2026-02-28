'use server';

import { revalidatePath } from 'next/cache';
import { addExpense, deleteExpense } from '../queries/expenses';

export async function createExpenseAction(formData) {
  const data = {
    description: formData.get('description'),
    amount: parseFloat(formData.get('amount')) || 0,
    expense_date: formData.get('expense_date'),
    notes: formData.get('notes'),
  };

  await addExpense(data);
  revalidatePath('/expenses');
}

export async function deleteExpenseAction(id) {
  await deleteExpense(id);
  revalidatePath('/expenses');
}

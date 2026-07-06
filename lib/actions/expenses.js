'use server';

import { revalidatePath } from 'next/cache';
import * as db from '../queries/expenses';

// ── Categories ──────────────────────────────────────────────

export async function createCategoryAction(name, color, type) {
  try {
    await db.createCategory(name, color, type);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateCategoryAction(id, name, color, type) {
  try {
    await db.updateCategory(id, name, color, type);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteCategoryAction(id) {
  try {
    await db.deleteCategory(id);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

// ── Expenses ────────────────────────────────────────────────

export async function addExpenseAction(description, amount, expense_date, category_id, notes) {
  try {
    await db.addExpense(description, amount, expense_date, category_id, notes);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateExpenseAction(id, description, amount, expense_date, category_id, notes) {
  try {
    await db.updateExpense(id, description, amount, expense_date, category_id, notes);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteExpenseAction(id) {
  try {
    await db.deleteExpense(id);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function bulkRenameExpensesAction(ids, newDescription) {
  try {
    await db.bulkRenameExpenses(ids, newDescription);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function bulkRecategoriseExpensesAction(ids, categoryId) {
  try {
    await db.bulkRecategoriseExpenses(ids, categoryId);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function bulkDeleteExpensesAction(ids) {
  try {
    await db.bulkDeleteExpenses(ids);
    revalidatePath('/expenses');
  } catch (error) {
    throw new Error(error.message);
  }
}

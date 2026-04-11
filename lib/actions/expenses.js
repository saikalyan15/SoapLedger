'use server';

import * as db from '../queries/expenses';

// ── Categories ──────────────────────────────────────────────

export async function createCategoryAction(name, color, type) {
  try {
    await db.createCategory(name, color, type);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateCategoryAction(id, name, color, type) {
  try {
    await db.updateCategory(id, name, color, type);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteCategoryAction(id) {
  try {
    await db.deleteCategory(id);
  } catch (error) {
    throw new Error(error.message);
  }
}

// ── Expenses ────────────────────────────────────────────────

export async function addExpenseAction(description, amount, expense_date, category_id, notes) {
  try {
    await db.addExpense(description, amount, expense_date, category_id, notes);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateExpenseAction(id, description, amount, expense_date, category_id, notes) {
  try {
    await db.updateExpense(id, description, amount, expense_date, category_id, notes);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deleteExpenseAction(id) {
  try {
    await db.deleteExpense(id);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function bulkRenameExpensesAction(ids, newDescription) {
  try {
    await db.bulkRenameExpenses(ids, newDescription);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function bulkRecategoriseExpensesAction(ids, categoryId) {
  try {
    await db.bulkRecategoriseExpenses(ids, categoryId);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function bulkDeleteExpensesAction(ids) {
  try {
    await db.bulkDeleteExpenses(ids);
  } catch (error) {
    throw new Error(error.message);
  }
}

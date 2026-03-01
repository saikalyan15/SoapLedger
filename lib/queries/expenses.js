'use server';

import sql from '@/lib/db';

// --- Categories ---

export async function getCategories() {
  return await sql`SELECT * FROM expense_categories ORDER BY name ASC`;
}

export async function createCategory(name, color) {
  const result = await sql`
    INSERT INTO expense_categories (name, color)
    VALUES (${name}, ${color})
    RETURNING *
  `;
  return result[0];
}

export async function updateCategory(id, name, color) {
  const result = await sql`
    UPDATE expense_categories 
    SET name = ${name}, color = ${color} 
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0];
}

export async function deleteCategory(id) {
  // Check if any expenses use this category
  const countResult = await sql`SELECT COUNT(*) FROM expenses WHERE category_id = ${id}`;
  const count = parseInt(countResult[0].count);
  
  if (count > 0) {
    throw new Error(`Reassign ${count} expense${count > 1 ? 's' : ''} before deleting`);
  }

  return await sql`DELETE FROM expense_categories WHERE id = ${id} RETURNING id`;
}

// --- Expenses ---

export async function getExpenses({ categoryId, search } = {}) {
  let query = sql`
    SELECT e.*, ec.name as category_name, ec.color as category_color
    FROM expenses e
    JOIN expense_categories ec ON ec.id = e.category_id
    WHERE 1=1
  `;

  if (categoryId) {
    query = sql`${query} AND e.category_id = ${categoryId}`;
  }

  if (search) {
    const ilikeSearch = `%${search}%`;
    query = sql`${query} AND e.description ILIKE ${ilikeSearch}`;
  }

  return await sql`${query} ORDER BY e.expense_date DESC, e.created_at DESC`;
}

export async function getExpenseSummary() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

  const totals = await sql`
    SELECT 
      COALESCE(SUM(amount) FILTER (WHERE expense_date >= ${firstDayOfMonth}), 0) as total_this_month,
      COALESCE(SUM(amount) FILTER (WHERE expense_date >= ${firstDayOfYear}), 0) as total_this_year,
      COALESCE(SUM(amount), 0) as total_all_time
    FROM expenses
  `;

  const byCategory = await sql`
    SELECT 
      ec.name as category_name, 
      ec.color, 
      SUM(e.amount) as total, 
      COUNT(e.id) as count
    FROM expense_categories ec
    LEFT JOIN expenses e ON e.category_id = ec.id
    GROUP BY ec.id, ec.name, ec.color
    HAVING SUM(e.amount) > 0
    ORDER BY total DESC
  `;

  return {
    ...totals[0],
    by_category: byCategory
  };
}

export async function addExpense(description, amount, expense_date, category_id, notes) {
  const result = await sql`
    INSERT INTO expenses (description, amount, expense_date, category_id, notes)
    VALUES (${description}, ${amount}, ${expense_date}, ${category_id}, ${notes})
    RETURNING *
  `;
  return result[0];
}

export async function updateExpense(id, description, amount, expense_date, category_id, notes) {
  const result = await sql`
    UPDATE expenses 
    SET description = ${description}, 
        amount = ${amount}, 
        expense_date = ${expense_date}, 
        category_id = ${category_id}, 
        notes = ${notes}
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0];
}

export async function deleteExpense(id) {
  return await sql`DELETE FROM expenses WHERE id = ${id} RETURNING id`;
}

export async function bulkRenameExpenses(ids, newDescription) {
  return await sql`
    UPDATE expenses 
    SET description = ${newDescription} 
    WHERE id = ANY(${ids})
    RETURNING id
  `;
}

export async function bulkRecategoriseExpenses(ids, categoryId) {
  return await sql`
    UPDATE expenses 
    SET category_id = ${categoryId} 
    WHERE id = ANY(${ids})
    RETURNING id
  `;
}

export async function bulkDeleteExpenses(ids) {
  return await sql`
    DELETE FROM expenses 
    WHERE id = ANY(${ids})
    RETURNING id
  `;
}

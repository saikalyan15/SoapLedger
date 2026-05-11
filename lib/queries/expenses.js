'use server';

import sql from '@/lib/db';
import { PAID_STATUSES } from './constants';

// ── Categories ──────────────────────────────────────────────

export async function getCategories() {
  return await sql`SELECT * FROM expense_categories ORDER BY type, name`;
}

export async function createCategory(name, color, type) {
  const result = await sql`
    INSERT INTO expense_categories (name, color, type)
    VALUES (${name}, ${color}, ${type})
    RETURNING *
  `;
  return result[0];
}

export async function updateCategory(id, name, color, type) {
  const result = await sql`
    UPDATE expense_categories 
    SET name = ${name}, color = ${color}, type = ${type} 
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0];
}

export async function deleteCategory(id) {
  // Check first: SELECT COUNT(*) FROM expenses WHERE category_id = id
  const countResult = await sql`SELECT COUNT(*) FROM expenses WHERE category_id = ${id}`;
  const count = parseInt(countResult[0].count);
  
  if (count > 0) {
    throw new Error(`Reassign ${count} expenses before deleting this category`);
  }
  
  return await sql`DELETE FROM expense_categories WHERE id = ${id} RETURNING id`;
}

// ── Expenses ────────────────────────────────────────────────

export async function getExpenses({ categoryId = null, search = null } = {}) {
  const ilikeSearch = search ? `%${search}%` : null;
  return sql`
    SELECT e.*, ec.name as category_name, ec.color as category_color, ec.type as category_type
    FROM expenses e
    JOIN expense_categories ec ON ec.id = e.category_id
    WHERE (${categoryId}::uuid IS NULL OR e.category_id = ${categoryId}::uuid)
    AND   (${ilikeSearch}::text IS NULL OR e.description ILIKE ${ilikeSearch}::text)
    ORDER BY e.expense_date DESC
  `;
}

export async function getExpenseSummary() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const summary = await sql`
    WITH totals AS (
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE EXTRACT(MONTH FROM expense_date) = ${currentMonth} AND EXTRACT(YEAR FROM expense_date) = ${currentYear}), 0) as total_this_month,
        COALESCE(SUM(amount) FILTER (WHERE EXTRACT(YEAR FROM expense_date) = ${currentYear}), 0) as total_this_year,
        COALESCE(SUM(amount), 0) as total_all_time,
        COALESCE(SUM(amount) FILTER (WHERE ec.type = 'recurring' AND EXTRACT(MONTH FROM expense_date) = ${currentMonth} AND EXTRACT(YEAR FROM expense_date) = ${currentYear}), 0) as recurring_total,
        COALESCE(SUM(amount) FILTER (WHERE ec.type = 'one_time' AND EXTRACT(MONTH FROM expense_date) = ${currentMonth} AND EXTRACT(YEAR FROM expense_date) = ${currentYear}), 0) as one_time_total
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e.category_id
    )
    SELECT * FROM totals
  `;

  // Period-aware cost price (last 3 months / 90 days)
  const costPriceStats = await sql`
    WITH period_expenses AS (
      SELECT COALESCE(SUM(e.amount), 0) as recurring_sum
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE ec.type = 'recurring'
      AND e.expense_date >= NOW() - INTERVAL '90 days'
    ),
    period_sales AS (
      SELECT COALESCE(SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END), 0) as soaps_sold
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status = ANY(${PAID_STATUSES})
      AND o.order_date >= NOW() - INTERVAL '90 days'
    )
    SELECT 
      CASE WHEN soaps_sold > 0 THEN recurring_sum / soaps_sold ELSE 0 END as cost_price_per_soap
    FROM period_expenses, period_sales
  `;

  const byCategory = await sql`
    SELECT 
      ec.id, 
      ec.name, 
      ec.color, 
      ec.type, 
      SUM(e.amount) as total, 
      COUNT(e.id) as count
    FROM expense_categories ec
    LEFT JOIN expenses e ON e.category_id = ec.id
    GROUP BY ec.id, ec.name, ec.color, ec.type
    HAVING SUM(e.amount) > 0
    ORDER BY total DESC
  `;

  const s = summary[0];

  return {
    total_this_month: parseFloat(s.total_this_month),
    total_this_year: parseFloat(s.total_this_year),
    total_all_time: parseFloat(s.total_all_time),
    recurring_total: parseFloat(s.recurring_total),
    one_time_total: parseFloat(s.one_time_total),
    by_category: byCategory.map(c => ({
      ...c,
      total: parseFloat(c.total),
      count: parseInt(c.count)
    })),
    cost_price_per_soap: parseFloat(costPriceStats[0]?.cost_price_per_soap || 0)
  };
}

export async function getExpenseMonthlyTrend() {
  const rows = await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', expense_date), 'Mon ''YY') as month,
      COALESCE(SUM(amount) FILTER (WHERE ec.type = 'recurring'), 0) as recurring,
      COALESCE(SUM(amount) FILTER (WHERE ec.type = 'one_time'), 0)  as one_time,
      COALESCE(SUM(amount), 0) as total
    FROM expenses e
    JOIN expense_categories ec ON ec.id = e.category_id
    WHERE expense_date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
    GROUP BY DATE_TRUNC('month', expense_date)
    ORDER BY DATE_TRUNC('month', expense_date)
  `;
  return rows.map(r => ({
    month:    r.month,
    recurring: parseFloat(r.recurring),
    one_time:  parseFloat(r.one_time),
    total:     parseFloat(r.total),
  }));
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
    WHERE id = ANY(${ids}::uuid[])
    RETURNING id
  `;
}

export async function bulkRecategoriseExpenses(ids, categoryId) {
  return await sql`
    UPDATE expenses 
    SET category_id = ${categoryId} 
    WHERE id = ANY(${ids}::uuid[])
    RETURNING id
  `;
}

export async function bulkDeleteExpenses(ids) {
  return await sql`
    DELETE FROM expenses 
    WHERE id = ANY(${ids}::uuid[])
    RETURNING id
  `;
}

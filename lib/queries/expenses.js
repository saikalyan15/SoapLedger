import sql from '../db';

export async function getExpenses() {
  return await sql`
    SELECT * FROM expenses 
    ORDER BY expense_date DESC, created_at DESC
  `;
}

export async function getExpenseSummary() {
  const result = await sql`
    SELECT 
      SUM(CASE WHEN expense_date >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END) as month_total,
      SUM(CASE WHEN expense_date >= date_trunc('year', CURRENT_DATE) THEN amount ELSE 0 END) as year_total,
      SUM(amount) as all_time_total
    FROM expenses
  `;
  return result[0];
}

export async function addExpense({ description, amount, expense_date, notes }) {
  return await sql`
    INSERT INTO expenses (description, amount, expense_date, notes)
    VALUES (${description}, ${amount}, ${expense_date}, ${notes})
    RETURNING *
  `;
}

export async function deleteExpense(id) {
  return await sql`
    DELETE FROM expenses
    WHERE id = ${id}
    RETURNING *
  `;
}

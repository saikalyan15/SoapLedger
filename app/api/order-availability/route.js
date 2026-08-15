import { validateApiKey } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(request) {
  if (!validateApiKey(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await sql`
    SELECT
      COALESCE((SELECT value FROM settings WHERE key = 'accepting_orders'), 'true') AS accepting_orders,
      NULLIF((SELECT value FROM settings WHERE key = 'orders_reopen_date'), '') AS reopen_date
  `;
  return Response.json({
    accepting_orders: rows[0]?.accepting_orders === 'true',
    reopen_date: rows[0]?.reopen_date || null,
  });
}

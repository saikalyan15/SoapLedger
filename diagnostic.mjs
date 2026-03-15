import 'dotenv/config';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function diagnostic() {
  console.log('--- Orders with ZERO items ---');
  const ghostOrders = await sql.query('SELECT id, status, order_date, created_at FROM orders WHERE id NOT IN (SELECT order_id FROM order_items)');
  console.log(JSON.stringify(ghostOrders, null, 2));

  console.log('\n--- Orders with "Order Placed" status ---');
  const placedOrders = await sql.query("SELECT id, status, created_at FROM orders WHERE status = 'Order Placed'");
  console.log(JSON.stringify(placedOrders, null, 2));

  process.exit();
}

diagnostic().catch(err => {
  console.error(err);
  process.exit(1);
});

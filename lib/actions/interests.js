'use server';

import { auth } from '@/auth';
import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
}

export async function setInterestContactedAction(id, contacted) {
  await requireSession();
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Invalid interest');
  }
  if (typeof contacted !== 'boolean') throw new Error('Invalid contacted state');

  const rows = await sql`
    UPDATE orders
    SET interest_contacted_at = ${contacted ? new Date().toISOString() : null}
    WHERE id = ${id}
      AND source = 'Expression of Interest'
      AND status = 'Awaiting Payment'
    RETURNING id
  `;
  if (rows.length === 0) throw new Error('Interest not found');
  revalidatePath('/interests');
}

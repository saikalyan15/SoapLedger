'use server';

import { revalidatePath } from 'next/cache';
import { logOutreach, markNotReady, markOrdered } from '@/lib/queries/customers';

export async function logOutreachAction(customerId) {
  await logOutreach(customerId);
  revalidatePath('/outreach');
}

export async function markNotReadyAction(customerId, followUpDate) {
  await markNotReady(customerId, followUpDate);
  revalidatePath('/outreach');
}

export async function markOrderedAction(customerId) {
  await markOrdered(customerId);
  revalidatePath('/outreach');
}

'use server';

import { logOutreach, markNotReady, markOrdered } from '@/lib/queries/customers';

export async function logOutreachAction(customerId) {
  await logOutreach(customerId, 'reorder');
}

export async function logReferralOutreachAction(customerId) {
  await logOutreach(customerId, 'referral');
}

export async function markNotReadyAction(customerId, followUpDate) {
  await markNotReady(customerId, followUpDate);
}

export async function markOrderedAction(customerId) {
  await markOrdered(customerId);
}

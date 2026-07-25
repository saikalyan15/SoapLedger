'use server';

import { signOut } from '@/auth';

/**
 * Server action for the sidebar sign-out button.
 *
 * Used instead of the client-side signOut() helper so the sidebar does not need
 * to be wrapped in a SessionProvider.
 */
export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}

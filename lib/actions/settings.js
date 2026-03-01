'use server';

import { revalidatePath } from 'next/cache';
import { updateSetting } from '../queries/settings';

export async function updateSettingAction(key, value) {
  await updateSetting(key, value);
  revalidatePath('/settings');
}

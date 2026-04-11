'use server';

import { updateSetting } from '../queries/settings';

export async function updateSettingAction(key, value) {
  await updateSetting(key, value);
}

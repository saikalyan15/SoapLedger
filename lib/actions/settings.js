'use server';

import { updateSetting } from '../queries/settings';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export async function updateSettingAction(key, value) {
  await updateSetting(key, value);
}

const BUSINESS_CONFIG_PATH = path.join(process.cwd(), 'lib/config/business.json');

export async function getBusinessConfigAction() {
  const raw = await readFile(BUSINESS_CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

export async function saveBusinessConfigAction(data) {
  await writeFile(BUSINESS_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

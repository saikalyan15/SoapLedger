'use server';

import { updateSetting } from '../queries/settings';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
}

export async function updateSettingAction(key, value) {
  await requireSession();
  if (typeof key !== 'string' || typeof value !== 'string' || key.length > 100 || value.length > 500) {
    throw new Error('Invalid setting');
  }
  if (key === 'accepting_orders' && !['true', 'false'].includes(value)) {
    throw new Error('Invalid order availability');
  }
  if (key === 'orders_reopen_date' && value !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Invalid reopening date');
  }
  await updateSetting(key, value);
}

const BUSINESS_CONFIG_PATH = path.join(process.cwd(), 'lib/config/business.json');

export async function getBusinessConfigAction() {
  await requireSession();
  const raw = await readFile(BUSINESS_CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

export async function saveBusinessConfigAction(data) {
  await requireSession();
  await writeFile(BUSINESS_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

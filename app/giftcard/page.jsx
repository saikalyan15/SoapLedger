import { getSettings } from '@/lib/queries/settings';
import GiftCardClient from './GiftCardClient';

export const dynamic = 'force-dynamic';

export default async function GiftCardPage() {
  const rows = await getSettings();
  const settings = Object.fromEntries(
    rows.filter(r => r.key.startsWith('giftcard_')).map(r => [r.key, r.value])
  );

  return <GiftCardClient savedSettings={settings} />;
}

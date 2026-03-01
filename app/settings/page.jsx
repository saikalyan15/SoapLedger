import { getSettings } from '@/lib/queries/settings';
import SettingsView from './SettingsView';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSettings();
  
  return <SettingsView settings={settings} />;
}

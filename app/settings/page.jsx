import { getSettings } from '@/lib/queries/settings';
import { getBusinessConfigAction } from '@/lib/actions/settings';
import SettingsView from './SettingsView';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [settings, businessConfig] = await Promise.all([
    getSettings(),
    getBusinessConfigAction(),
  ]);

  return <SettingsView settings={settings} businessConfig={businessConfig} />;
}

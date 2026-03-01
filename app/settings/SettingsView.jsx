'use client';

import { useState } from 'react';
import { Save, Settings as SettingsIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { updateSettingAction } from '@/lib/actions/settings';

export default function SettingsView({ settings }) {
  const [savingKey, setSavingKey] = useState(null);
  const [successKey, setSuccessKey] = useState(null);

  const handleUpdate = async (key, value) => {
    setSavingKey(key);
    try {
      await updateSettingAction(key, value);
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 2000);
    } catch (e) {
      alert("Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="pb-32 max-w-[800px]">
      {/* Page Header */}
      <div className="pt-2">
        <h1 className="text-[36px] text-primary font-normal leading-none m-0 font-serif">
          Settings
        </h1>
        <p className="text-sm text-muted mt-1.5 m-0 font-sans">
          Configure business rules and default values
        </p>
      </div>

      <div className="mt-8 border-b-2 border-border mb-10"></div>

      <div className="space-y-6">
        {settings.map((setting) => (
          <div 
            key={setting.key} 
            className="bg-white border border-[#EBEBEB] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-primary-light"
          >
            <div className="flex-1">
              <div className="font-sans text-[13px] font-bold uppercase tracking-[0.1em] text-primary mb-1">
                {setting.key.replace(/_/g, ' ')}
              </div>
              <p className="font-sans text-[14px] text-muted m-0">
                {setting.description || "No description provided."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input 
                  type="text"
                  defaultValue={setting.value}
                  className="w-[120px] px-3.5 py-2.5 border border-border rounded-lg text-sm font-semibold text-[#1A1A1A] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all font-sans bg-[#FAFAFA]"
                  onBlur={(e) => {
                    if (e.target.value !== setting.value) {
                      handleUpdate(setting.key, e.target.value);
                    }
                  }}
                />
              </div>
              
              <div className="w-10 flex justify-center">
                {savingKey === setting.key ? (
                  <Loader2 size={18} className="animate-spin text-primary" />
                ) : successKey === setting.key ? (
                  <CheckCircle2 size={18} className="text-[#10B981] animate-in zoom-in" />
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Helpful Info Section */}
      <div className="mt-16 bg-[#FAFDF9] border border-primary-light rounded-xl p-8 shadow-[0_2px_12px_rgba(27,67,50,0.05)]">
        <h3 className="font-serif text-[20px] text-primary mb-4 font-normal">Business Rule Precedence</h3>
        <p className="font-sans text-sm text-muted leading-relaxed m-0">
          The values above represent the source of truth for calculations. Note that some values in the code (defined in <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono text-[12px]">lib/constants.js</code>) are used as hard fallbacks if the database settings are empty or unreachable. 
          <br /><br />
          Updates to these values will apply immediately to all new entries but will not change existing historical data.
        </p>
      </div>
    </div>
  );
}

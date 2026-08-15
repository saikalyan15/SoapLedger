'use client';

import { useState, useRef } from 'react';
import { Save, CheckCircle2, Loader2, Download, Upload, AlertTriangle, ShieldCheck, Building2 } from 'lucide-react';
import { updateSettingAction, saveBusinessConfigAction } from '@/lib/actions/settings';

function indiaDateString() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export default function SettingsView({ settings, businessConfig }) {
  const [savingKey, setSavingKey] = useState(null);
  const [successKey, setSuccessKey] = useState(null);

  const initialCapacity = settings.find(s => s.key === 'monthly_capacity')?.value || '30';
  const [monthlyCapacity, setMonthlyCapacity] = useState(initialCapacity);
  const initialAcceptingOrders = settings.find(s => s.key === 'accepting_orders')?.value !== 'false';
  const [acceptingOrders, setAcceptingOrders] = useState(initialAcceptingOrders);
  const initialReopenDate = settings.find(s => s.key === 'orders_reopen_date')?.value || '';
  const [reopenDate, setReopenDate] = useState(initialReopenDate);
  const [savedReopenDate, setSavedReopenDate] = useState(initialReopenDate);
  const [todayInIndia] = useState(indiaDateString);

  // ── Backup state ───────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [importFile, setImportFile] = useState(null);   // parsed backup JSON
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [importStatus, setImportStatus] = useState('idle'); // idle | confirming | loading | done | error
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // ── Business profile state ─────────────────────────────────────────
  const [bizConfig, setBizConfig] = useState(businessConfig);
  const [bizSaving, setBizSaving] = useState(false);
  const [bizSaved, setBizSaved] = useState(false);

  const handleBizChange = (section, field, value) => {
    setBizConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleBizSave = async () => {
    setBizSaving(true);
    try {
      await saveBusinessConfigAction(bizConfig);
      setBizSaved(true);
      setTimeout(() => setBizSaved(false), 2000);
    } catch {
      alert('Failed to save business profile');
    } finally {
      setBizSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/backup/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `soapledger-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');
    setImportStatus('idle');
    setImportFile(null);
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.app || parsed.app !== 'SoapLedger') {
          setImportError('This file was not exported from SoapLedger.');
          return;
        }
        if (!parsed.tables) {
          setImportError('Backup file is missing table data.');
          return;
        }
        setImportFile(parsed);
        setImportStatus('confirming');
      } catch {
        setImportError('Could not parse file — make sure it is a valid SoapLedger backup.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportStatus('loading');
    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importFile),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setImportStatus('error');
        setImportError(data.error || 'Import failed.');
      } else {
        setImportStatus('done');
        setImportResult(data.restored);
      }
    } catch (e) {
      setImportStatus('error');
      setImportError('Network error: ' + e.message);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportFileName('');
    setImportError('');
    setImportStatus('idle');
    setImportResult(null);
  };

  const handleUpdate = async (key, value) => {
    setSavingKey(key);
    try {
      await updateSettingAction(key, value);
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 2000);
      return true;
    } catch {
      alert("Failed to update setting");
      return false;
    } finally {
      setSavingKey(null);
    }
  };

  const saveCapacity = () => handleUpdate('monthly_capacity', monthlyCapacity);

  const mainSettings = settings.filter(s => !['monthly_capacity', 'accepting_orders', 'orders_reopen_date'].includes(s.key));

  const toggleOrders = async () => {
    const next = !acceptingOrders;
    setAcceptingOrders(next);
    setSavingKey('accepting_orders');
    try {
      await updateSettingAction('accepting_orders', String(next));
      setSuccessKey('accepting_orders');
      setTimeout(() => setSuccessKey(null), 2000);
    } catch {
      setAcceptingOrders(!next);
      alert('Failed to update website order availability');
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
        <div className={`rounded-xl border p-6 shadow-sm ${acceptingOrders ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-[#FECACA] bg-[#FEF2F2]'}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-sans text-[13px] font-bold uppercase tracking-[0.1em] text-primary mb-1">
                Website orders
              </div>
              <p className="font-sans text-[14px] text-muted m-0">
                {acceptingOrders
                  ? 'Checkout is open. Customers can pay and place orders.'
                  : 'Checkout is paused. Customers can save an Expression of Interest and ask to be notified.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={acceptingOrders}
              onClick={toggleOrders}
              disabled={savingKey === 'accepting_orders'}
              className={`min-w-[190px] rounded-lg px-5 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60 ${acceptingOrders ? 'bg-[#B91C1C] hover:bg-[#991B1B]' : 'bg-primary hover:bg-primary-dark'}`}
            >
              {savingKey === 'accepting_orders'
                ? 'Updating…'
                : acceptingOrders ? 'Pause new orders' : 'Resume new orders'}
            </button>
          </div>
          <p className="mt-3 font-sans text-xs text-[#6B7280]">
            This takes effect immediately. Existing orders and carts are not changed.
          </p>
          <div className="mt-5 border-t border-black/10 pt-5">
            <label htmlFor="orders-reopen-date" className="block font-sans text-[13px] font-bold text-[#374151]">
              Estimated reopening date (optional)
            </label>
            <p className="mt-1 font-sans text-xs text-[#6B7280]">
              Shown to customers while checkout is paused. This date never resumes ordering automatically.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                id="orders-reopen-date"
                type="date"
                value={reopenDate}
                onChange={(event) => setReopenDate(event.target.value)}
                className="rounded-lg border border-border bg-white px-3.5 py-2.5 font-sans text-sm font-semibold text-[#1A1A1A] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={async () => {
                  if (await handleUpdate('orders_reopen_date', reopenDate)) {
                    setSavedReopenDate(reopenDate);
                  }
                }}
                disabled={savingKey === 'orders_reopen_date' || reopenDate === savedReopenDate}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-sans text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {savingKey === 'orders_reopen_date' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save date
              </button>
              {successKey === 'orders_reopen_date' && <CheckCircle2 size={18} className="text-[#10B981]" />}
            </div>
            {reopenDate && reopenDate < todayInIndia && (
              <p className="mt-2 font-sans text-xs font-semibold text-[#B45309]">
                This date has passed. Customers will see the generic paused message until you choose a new date.
              </p>
            )}
          </div>
        </div>

        {mainSettings.map((setting) => (
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

      {/* Production Settings Section */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: '20px',
          color: '#1B4332',
          marginBottom: '4px',
        }}>Production</h2>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: '14px',
          color: '#6B7280',
          marginBottom: '20px',
        }}>
          Set your production limits to track capacity on the dashboard
        </p>

        <div style={{ maxWidth: '400px' }} className="bg-white border border-[#EBEBEB] rounded-xl p-6 shadow-sm">
          <label style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
            display: 'block',
            marginBottom: '6px',
          }}>
            Monthly Production Capacity (soaps)
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="number"
              value={monthlyCapacity}
              onChange={(e) => setMonthlyCapacity(e.target.value)}
              min="1"
              max="999"
              className="w-[120px] px-3.5 py-2.5 border border-border rounded-lg text-sm font-semibold text-[#1A1A1A] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all font-sans bg-[#FAFAFA]"
            />
            <button 
              onClick={saveCapacity}
              disabled={savingKey === 'monthly_capacity'}
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {savingKey === 'monthly_capacity' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>
            {successKey === 'monthly_capacity' && <CheckCircle2 size={18} className="text-[#10B981]" />}
          </div>
          <p style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '12px',
            color: '#9CA3AF',
            marginTop: '8px',
          }}>
            The dashboard shows a warning when monthly production approaches this number.
            Update it when you hire help or buy more moulds.
          </p>
        </div>
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

      {/* ── Business Profile ─────────────────────────────────────────── */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: '#1B4332', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} /> Business Profile
        </h2>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
          Used on print labels and outreach messages.
        </p>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '12px' }}>Brand</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { field: 'name',    label: 'Brand Name' },
                { field: 'website', label: 'Website' },
                { field: 'license', label: 'Udyam Registration No.' },
              ].map(({ field, label }) => (
                <div key={field} style={field === 'license' ? { gridColumn: '1 / -1' } : {}}>
                  <label style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <input
                    value={bizConfig.brand?.[field] || ''}
                    onChange={e => handleBizChange('brand', field, e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #F3F4F6' }} />

          {/* Return Address */}
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '12px' }}>Return Address (From Label)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { field: 'name',        label: 'Name',          full: false },
                { field: 'phone',       label: 'Phone',         full: false },
                { field: 'line1',       label: 'Address Line 1', full: true },
                { field: 'line2',       label: 'Address Line 2', full: true },
                { field: 'line3',       label: 'Address Line 3', full: true },
                { field: 'cityStateZip', label: 'City, State, PIN', full: true },
              ].map(({ field, label, full }) => (
                <div key={field} style={full ? { gridColumn: '1 / -1' } : {}}>
                  <label style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <input
                    value={bizConfig.returnAddress?.[field] || ''}
                    onChange={e => handleBizChange('returnAddress', field, e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
            <button
              onClick={handleBizSave}
              disabled={bizSaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', border: 'none', background: bizSaving ? '#E5E7EB' : '#1B4332', color: bizSaving ? '#9CA3AF' : '#FFFFFF', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '14px', cursor: bizSaving ? 'not-allowed' : 'pointer' }}
            >
              {bizSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {bizSaving ? 'Saving...' : 'Save Business Profile'}
            </button>
            {bizSaved && <CheckCircle2 size={18} color="#10B981" />}
          </div>
        </div>
      </div>

      {/* ── Backup & Restore ─────────────────────────────────────────── */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: '#1B4332', marginBottom: '4px' }}>
          Backup &amp; Restore
        </h2>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
          Export a full snapshot of all your data, or restore from a previous backup.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* Export card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: '#F0FDF4', borderRadius: '8px', color: '#1B4332' }}>
                <Download size={18} />
              </div>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '15px', color: '#111827' }}>
                Export Backup
              </span>
            </div>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px', color: '#6B7280', marginBottom: '20px', lineHeight: '1.5' }}>
              Downloads a <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>.json</code> file containing all orders, customers, products, expenses, and settings. Store it somewhere safe.
            </p>
            <button
              onClick={handleExport}
              disabled={isExporting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                background: isExporting ? '#E5E7EB' : '#1B4332',
                color: isExporting ? '#9CA3AF' : '#FFFFFF',
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '14px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
              }}
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting ? 'Exporting...' : 'Download Backup'}
            </button>
          </div>

          {/* Import card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: '#FEF3C7', borderRadius: '8px', color: '#92400E' }}>
                <Upload size={18} />
              </div>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '15px', color: '#111827' }}>
                Restore from Backup
              </span>
            </div>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px', color: '#6B7280', marginBottom: '20px', lineHeight: '1.5' }}>
              Replaces <strong>all current data</strong> with the contents of a backup file. This cannot be undone — export first.
            </p>

            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileSelect} />

            {/* Idle: show choose file button */}
            {importStatus === 'idle' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '8px',
                  border: '1px solid #E5E7EB', background: '#FFFFFF',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '14px',
                  color: '#374151', cursor: 'pointer',
                }}
              >
                <Upload size={16} />
                Choose Backup File
              </button>
            )}

            {/* File parse error */}
            {importError && importStatus === 'idle' && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#DC2626', fontSize: '13px' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                {importError}
              </div>
            )}

            {/* Confirm state: show summary and confirm button */}
            {importStatus === 'confirming' && importFile && (
              <div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', color: '#92400E', fontWeight: 700, fontSize: '13px' }}>
                    <AlertTriangle size={14} /> Ready to restore — this will replace all data
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '12px', color: '#78350F', lineHeight: '1.8' }}>
                    <div><strong>File:</strong> {importFileName}</div>
                    <div><strong>Exported:</strong> {new Date(importFile.exported_at).toLocaleString('en-IN')}</div>
                    <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
                      {Object.entries(importFile.counts || {}).map(([table, count]) => (
                        <span key={table}>{table.replace(/_/g, ' ')}: <strong>{count}</strong></span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleImport}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '10px 20px', borderRadius: '8px', border: 'none',
                      background: '#DC2626', color: '#FFFFFF',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                    }}
                  >
                    <AlertTriangle size={15} /> Yes, Replace All Data
                  </button>
                  <button
                    onClick={resetImport}
                    style={{
                      padding: '10px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                      background: '#FFFFFF', fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontWeight: 600, fontSize: '14px', color: '#6B7280', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {importStatus === 'loading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1B4332', fontSize: '14px', fontWeight: 600 }}>
                <Loader2 size={18} className="animate-spin" />
                Restoring data — do not close this page...
              </div>
            )}

            {/* Success */}
            {importStatus === 'done' && importResult && (
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#166534', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>
                  <ShieldCheck size={18} /> Restore complete
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#166534', lineHeight: '1.8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px', marginBottom: '14px' }}>
                  {Object.entries(importResult).map(([table, count]) => (
                    <span key={table}>{table.replace(/_/g, ' ')}: <strong>{count}</strong></span>
                  ))}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: '#1B4332', color: '#FFFFFF',
                    fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Reload Page
                </button>
              </div>
            )}

            {/* Error */}
            {importStatus === 'error' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span><strong>Restore failed:</strong> {importError}<br />Your existing data has not been changed.</span>
                </div>
                <button
                  onClick={resetImport}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                    background: '#FFFFFF', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 600, fontSize: '13px', color: '#374151', cursor: 'pointer',
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

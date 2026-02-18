'use client';

import { useEffect, useState } from 'react';
import { masterService } from '@/services/master.service';
import { cn } from '@/lib/utils';
import { Settings, Save, AlertTriangle } from 'lucide-react';

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res: any = await masterService.getSettings();
      setSettings(res?.data || {});
    } catch (err) { console.error('Failed to load settings', err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await masterService.updateSettings(settings);
      setMessage({ type: 'success', text: 'Settings updated successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save' });
    } finally { setSaving(false); }
  };

  const handleToggleMaintenance = async () => {
    try {
      await masterService.toggleMaintenanceMode();
      setMessage({ type: 'success', text: 'Maintenance mode toggled' });
      loadSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const updateField = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-brand-gold" /> Platform Settings
      </h2>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {/* Maintenance Mode */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" /> Maintenance Mode
            </h3>
            <p className="text-xs text-muted-foreground mt-1">When enabled, users cannot access the platform</p>
          </div>
          <button onClick={handleToggleMaintenance}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition',
              settings?.maintenanceMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
            )}>
            {settings?.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4">General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Platform Name</label>
            <input type="text" value={settings?.platformName || ''} onChange={(e) => updateField('platformName', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Platform Logo URL</label>
            <input type="text" value={settings?.platformLogo || ''} onChange={(e) => updateField('platformLogo', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-foreground mb-1">Welcome Banner Text</label>
            <input type="text" value={settings?.welcomeBanner || ''} onChange={(e) => updateField('welcomeBanner', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
              placeholder="Scrolling banner text shown to users" />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4">Features</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'registrationOpen', label: 'Registration Open' },
            { key: 'casinoEnabled', label: 'Casino Enabled' },
            { key: 'liveBettingEnabled', label: 'Live Betting' },
            { key: 'depositEnabled', label: 'Deposits Enabled' },
            { key: 'withdrawalEnabled', label: 'Withdrawals Enabled' },
            { key: 'autoSettlementEnabled', label: 'Auto Settlement' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted">
              <span className="text-sm text-foreground">{label}</span>
              <div className="relative">
                <input type="checkbox" checked={settings?.[key] || false} onChange={(e) => updateField(key, e.target.checked)}
                  className="sr-only peer" />
                <div className="w-10 h-5 bg-muted peer-checked:bg-brand-gold rounded-full transition cursor-pointer" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full transition peer-checked:translate-x-5" />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Settlement Config */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4">Settlement Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Settlement Frequency</label>
            <select value={settings?.settlementFrequency || 'WEEKLY'} onChange={(e) => updateField('settlementFrequency', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-card">
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Settlement Day</label>
            <input type="number" min="0" max="28" value={settings?.settlementDay || 0}
              onChange={(e) => updateField('settlementDay', Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            <p className="text-[10px] text-muted-foreground mt-0.5">0=Sunday for weekly, 1-28 for monthly</p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4">Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Max Login Attempts</label>
            <input type="number" min="1" value={settings?.maxLoginAttempts || 5}
              onChange={(e) => updateField('maxLoginAttempts', Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Lockout Duration (min)</label>
            <input type="number" min="1" value={settings?.lockoutDuration || 30}
              onChange={(e) => updateField('lockoutDuration', Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Session Timeout (min)</label>
            <input type="number" min="1" value={settings?.sessionTimeout || 60}
              onChange={(e) => updateField('sessionTimeout', Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <label className="flex items-center gap-2 mt-4 p-3 border rounded-lg cursor-pointer hover:bg-muted">
          <input type="checkbox" checked={settings?.twoFactorRequired || false}
            onChange={(e) => updateField('twoFactorRequired', e.target.checked)}
            className="w-4 h-4 rounded border-border text-brand-gold focus:ring-brand-gold" />
          <span className="text-sm text-foreground">Require 2FA for admin logins</span>
        </label>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Settings'}
      </button>
    </div>
  );
}

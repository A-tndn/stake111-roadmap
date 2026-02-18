'use client';

import { useEffect, useState } from 'react';
import { masterService } from '@/services/master.service';
import { cn } from '@/lib/utils';
import { Landmark, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommissionSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [commission, setCommission] = useState({
    superMasterRate: 2,
    masterRate: 3,
    agentRate: 5,
    casinoCommission: 3,
    sportCommission: 5,
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res: any = await masterService.getSettings();
      const data = res?.data;
      if (data?.commissionStructure) {
        const cs = typeof data.commissionStructure === 'string'
          ? JSON.parse(data.commissionStructure) : data.commissionStructure;
        setCommission({ ...commission, ...cs });
      }
    } catch (err) { console.error('Failed to load settings', err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await masterService.updateCommissionStructure({ commissionStructure: commission });
      setMessage({ type: 'success', text: 'Commission structure updated' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </button>

      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <Landmark className="w-5 h-5 text-brand-gold" /> Commission Structure
      </h2>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4">Commission Rates by Role</h3>
        <div className="space-y-4">
          {[
            { key: 'superMasterRate', label: 'Super Master Commission (%)', color: 'border-l-yellow-500' },
            { key: 'masterRate', label: 'Master Commission (%)', color: 'border-l-blue-500' },
            { key: 'agentRate', label: 'Agent Commission (%)', color: 'border-l-green-500' },
          ].map(({ key, label, color }) => (
            <div key={key} className={cn('border-l-4 pl-4 py-2', color)}>
              <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
              <input type="number" min="0" max="50" step="0.5"
                value={(commission as any)[key]}
                onChange={(e) => setCommission({ ...commission, [key]: Number(e.target.value) })}
                className="w-48 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4">Commission by Game Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Sports Betting Commission (%)</label>
            <input type="number" min="0" max="50" step="0.5" value={commission.sportCommission}
              onChange={(e) => setCommission({ ...commission, sportCommission: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Casino Commission (%)</label>
            <input type="number" min="0" max="50" step="0.5" value={commission.casinoCommission}
              onChange={(e) => setCommission({ ...commission, casinoCommission: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
        </div>
      </div>

      {/* Visual breakdown */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4">Commission Flow Example</h3>
        <p className="text-xs text-muted-foreground mb-3">For a ₹10,000 bet that platform wins:</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-muted rounded">
            <span className="text-muted-foreground">Platform keeps</span>
            <span className="font-medium">{100 - commission.superMasterRate - commission.masterRate - commission.agentRate}%</span>
          </div>
          <div className="flex justify-between p-2 bg-yellow-50 rounded">
            <span className="text-yellow-700">→ Super Master gets</span>
            <span className="font-medium text-yellow-700">{commission.superMasterRate}%</span>
          </div>
          <div className="flex justify-between p-2 bg-blue-50 rounded">
            <span className="text-blue-700">→ Master gets</span>
            <span className="font-medium text-blue-700">{commission.masterRate}%</span>
          </div>
          <div className="flex justify-between p-2 bg-green-50 rounded">
            <span className="text-green-700">→ Agent gets</span>
            <span className="font-medium text-green-700">{commission.agentRate}%</span>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Commission Structure'}
      </button>
    </div>
  );
}

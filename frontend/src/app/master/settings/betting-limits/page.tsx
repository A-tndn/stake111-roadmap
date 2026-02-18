'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { masterService } from '@/services/master.service';
import { cn } from '@/lib/utils';
import { Activity, Save, ArrowLeft } from 'lucide-react';

export default function BettingLimitsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [limits, setLimits] = useState({
    globalMinBet: 100,
    globalMaxBet: 500000,
    globalMaxPayout: 2500000,
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res: any = await masterService.getSettings();
      const data = res?.data;
      if (data) {
        setLimits({
          globalMinBet: data.globalMinBet || 100,
          globalMaxBet: data.globalMaxBet || 500000,
          globalMaxPayout: data.globalMaxPayout || 2500000,
        });
      }
    } catch (err) { console.error('Failed to load settings', err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await masterService.updateBettingLimits(limits);
      setMessage({ type: 'success', text: 'Betting limits updated' });
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
        <Activity className="w-5 h-5 text-brand-gold" /> Global Betting Limits
      </h2>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4">Bet Amount Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Minimum Bet Amount (₹)</label>
            <input type="number" min="1" value={limits.globalMinBet}
              onChange={(e) => setLimits({ ...limits, globalMinBet: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            <p className="text-[10px] text-muted-foreground mt-1">Lowest bet amount allowed</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Maximum Bet Amount (₹)</label>
            <input type="number" min="1" value={limits.globalMaxBet}
              onChange={(e) => setLimits({ ...limits, globalMaxBet: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            <p className="text-[10px] text-muted-foreground mt-1">Highest single bet allowed</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Maximum Payout (₹)</label>
            <input type="number" min="1" value={limits.globalMaxPayout}
              onChange={(e) => setLimits({ ...limits, globalMaxPayout: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            <p className="text-[10px] text-muted-foreground mt-1">Max payout from a single bet</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-3">Current Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-green-600">Min Bet</p>
            <p className="text-lg font-bold text-green-700">₹{limits.globalMinBet.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-600">Max Bet</p>
            <p className="text-lg font-bold text-blue-700">₹{limits.globalMaxBet.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <p className="text-xs text-purple-600">Max Payout</p>
            <p className="text-lg font-bold text-purple-700">₹{limits.globalMaxPayout.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Betting Limits'}
      </button>
    </div>
  );
}

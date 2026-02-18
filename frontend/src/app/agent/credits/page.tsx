'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { agentService } from '@/services/agent.service';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';

export default function AgentCreditsPage() {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<'transfer' | 'deduct'>('transfer');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [amount, setAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadPlayers(); }, []);

  const loadPlayers = async () => {
    try {
      const res = await agentService.getPlayers();
      setPlayers((res as any).data || []);
    } catch (error) { console.error('Failed to load players:', error); }
    finally { setLoading(false); }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const amt = parseFloat(amount);
      if (actionType === 'transfer') {
        await agentService.transferCredit(selectedPlayer, amt);
        setMessage({ type: 'success', text: `Transferred ${formatCurrency(amt)}` });
      } else {
        await agentService.deductCredit(selectedPlayer, amt);
        setMessage({ type: 'success', text: `Deducted ${formatCurrency(amt)}` });
      }
      setAmount(''); setSelectedPlayer(''); loadPlayers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Transaction failed' });
    } finally { setActionLoading(false); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-brand-teal" /> Credit Management
      </h2>

      {message.text && (
        <div className={cn('mb-4 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200')}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-foreground text-sm mb-3">Transfer / Deduct</h3>
          <div className="flex rounded-lg bg-muted p-1 mb-4">
            {(['transfer', 'deduct'] as const).map((t) => (
              <button key={t} onClick={() => setActionType(t)}
                className={cn('flex-1 py-2 rounded-md text-sm font-medium transition capitalize',
                  actionType === t ? `bg-card shadow ${t === 'transfer' ? 'text-green-600' : 'text-red-600'}` : 'text-muted-foreground')}>
                {t}
              </button>
            ))}
          </div>
          <form onSubmit={handleAction} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Player</label>
              <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} required
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Choose player...</option>
                {players.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.displayName} - {formatCurrency(Number(p.balance))}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" required
                className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Enter amount" />
            </div>
            <button type="submit" disabled={actionLoading || !selectedPlayer || !amount}
              className={cn('w-full py-2.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-50',
                actionType === 'transfer' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')}>
              {actionLoading ? 'Processing...' : actionType === 'transfer' ? 'Transfer Credits' : 'Deduct Credits'}
            </button>
          </form>
          <div className="mt-3 p-2.5 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">Your Balance: <span className="font-bold">{formatCurrency(user?.balance || 0)}</span></p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border">
          <div className="p-4 border-b"><h3 className="font-semibold text-foreground text-sm">Player Balances</h3></div>
          {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div> :
           players.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No players</div> : (
            <div className="divide-y">
              {players.map((player: any) => (
                <div key={player.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{player.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{player.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(Number(player.balance))}</p>
                    <p className="text-[10px] text-muted-foreground">Limit: {formatCurrency(Number(player.creditLimit))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

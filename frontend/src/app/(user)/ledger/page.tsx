'use client';

import { useEffect, useState } from 'react';
import { betService } from '@/services/bet.service';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

export default function LedgerPage() {
  const { user } = useAuthStore();
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res: any = await betService.getUserBets({ limit: 100 });
      const data = res?.data?.bets || res?.bets || res?.data || [];
      setBets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const settled = bets.filter((b: any) => b.status === 'WON' || b.status === 'LOST');
  const totalStaked = settled.reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0);
  const totalWon = settled.filter((b: any) => b.status === 'WON').reduce((sum: number, b: any) => sum + parseFloat(b.actualWin || 0), 0);
  const netPnL = totalWon - totalStaked;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-teal" />
          Ledger
        </h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2 px-3 mb-3">
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className="text-lg font-bold text-brand-teal">{formatCurrency(user?.balance || 0)}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Net P&L</p>
          <p className={cn('text-lg font-bold', netPnL >= 0 ? 'text-green-600' : 'text-red-600')}>
            {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Staked</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalStaked)}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Won</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalWon)}</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="px-3 pb-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">Recent Activity</h2>
        {loading ? (
          <div className="bg-card rounded-lg border h-40 animate-pulse" />
        ) : settled.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No activity yet</div>
        ) : (
          <div className="space-y-1.5">
            {settled.slice(0, 20).map((bet: any) => {
              const pnl = bet.status === 'WON' ? parseFloat(bet.actualWin || 0) - parseFloat(bet.amount) : -parseFloat(bet.amount);
              return (
                <div key={bet.id} className="bg-card rounded-lg border px-3 py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{bet.match?.name || bet.betOn}</p>
                    <p className="text-[10px] text-muted-foreground/70">{formatDate(bet.settledAt || bet.createdAt)}</p>
                  </div>
                  <span className={cn('text-sm font-semibold whitespace-nowrap', pnl >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

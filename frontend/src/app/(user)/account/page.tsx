'use client';

import { useEffect, useState } from 'react';
import { betService } from '@/services/bet.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';

export default function AccountStatementPage() {
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
      console.error('Failed to load account statement', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate running P&L
  let runningPnL = 0;
  const entries = bets
    .filter((b: any) => b.status === 'WON' || b.status === 'LOST')
    .map((bet: any) => {
      const amount = parseFloat(bet.amount);
      const won = bet.status === 'WON' ? parseFloat(bet.actualWin || 0) : 0;
      const pnl = won - amount;
      runningPnL += pnl;
      return { ...bet, pnl, runningPnL };
    });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-teal" />
          Account Statement
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Settled bets and P&L</p>
      </div>

      {/* Summary */}
      <div className="px-3 mb-3">
        <div className="bg-card rounded-lg border p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Net P&L</span>
          <span className={cn('text-lg font-bold', runningPnL >= 0 ? 'text-green-600' : 'text-red-600')}>
            {runningPnL >= 0 ? '+' : ''}{formatCurrency(runningPnL)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="px-3 pb-4">
        {loading ? (
          <div className="bg-card rounded-lg border h-40 animate-pulse" />
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No settled bets yet</div>
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Match</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Stake</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">P&L</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: any) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {formatDate(entry.settledAt || entry.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-foreground truncate max-w-[150px]">
                        {entry.match?.name || entry.betOn}
                      </td>
                      <td className="px-3 py-2 text-right">{formatCurrency(parseFloat(entry.amount))}</td>
                      <td className={cn('px-3 py-2 text-right font-medium', entry.pnl >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {entry.pnl >= 0 ? '+' : ''}{formatCurrency(entry.pnl)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(entry.runningPnL)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

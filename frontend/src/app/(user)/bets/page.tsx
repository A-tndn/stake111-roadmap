'use client';

import { useEffect, useState } from 'react';
import { betService } from '@/services/bet.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ScrollText } from 'lucide-react';

const STATUS_FILTERS = ['all', 'PENDING', 'WON', 'LOST', 'VOID'];

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
  VOID: 'bg-muted text-foreground/80',
  CANCELLED: 'bg-muted text-muted-foreground',
};

export default function BetsPage() {
  const [bets, setBets] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBets();
  }, [filter]);

  const loadBets = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter !== 'all') params.status = filter;
      const res: any = await betService.getUserBets(params);
      const data = res?.data?.bets || res?.bets || res?.data || [];
      setBets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bets', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-brand-teal" />
          My Bets
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition',
              filter === f
                ? 'bg-brand-teal text-white'
                : 'bg-card text-muted-foreground border hover:bg-muted'
            )}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Bets list */}
      <div className="px-3 pb-4 space-y-2">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-lg border h-20 animate-pulse" />
          ))
        ) : bets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No bets found</div>
        ) : (
          bets.map((bet: any) => (
            <div key={bet.id} className="bg-card rounded-lg border p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {bet.match?.name || bet.matchId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bet.betType} - {bet.betOn}
                  </p>
                </div>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', statusColors[bet.status] || 'bg-muted')}>
                  {bet.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>Stake: <strong>{formatCurrency(parseFloat(bet.amount))}</strong></span>
                  <span>Odds: <strong>{parseFloat(bet.odds).toFixed(2)}</strong></span>
                  <span className={cn(bet.isBack ? 'text-blue-600' : 'text-red-500', 'font-medium')}>
                    {bet.isBack ? 'BACK' : 'LAY'}
                  </span>
                </div>
                <span className="text-muted-foreground/70">{formatDate(bet.createdAt)}</span>
              </div>
              {bet.status === 'WON' && bet.actualWin && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  Won: {formatCurrency(parseFloat(bet.actualWin))}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

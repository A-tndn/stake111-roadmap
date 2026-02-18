'use client';

import { useEffect, useState } from 'react';
import { masterService } from '@/services/master.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

export default function CompletedMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    try {
      const res: any = await masterService.getAllMatches({ status: 'COMPLETED', limit: 100 });
      const data = res?.data?.matches || res?.data || [];
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load matches', err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-brand-gold" /> Completed Matches
      </h2>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No completed matches</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Match', 'Winner', 'Date', 'Total Bets', 'Volume', 'Settled'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {matches.map((m: any) => (
                  <tr key={m.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{m.teamA} vs {m.teamB}</p>
                      <p className="text-xs text-muted-foreground">{m.league || m.seriesName}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-green-600">{m.matchWinner || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(m.matchDate || m.startTime)}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{m._count?.bets || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-medium">{formatCurrency(Number(m.totalBetVolume || 0))}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                        m.isSettled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {m.isSettled ? 'Settled' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

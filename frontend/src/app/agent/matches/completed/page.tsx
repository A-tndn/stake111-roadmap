'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trophy, CheckCircle } from 'lucide-react';

export default function CompletedMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    try {
      const res: any = await adminService.getCompletedMatches({ limit: 50 });
      const data = res?.data?.matches || res?.data || [];
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-brand-teal" /> Completed Matches
      </h2>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-xl border h-16 animate-pulse" />)}</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No completed matches</div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Match', 'Winner', 'Bets', 'Total Amount', 'Settled', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {matches.map((match: any) => (
                  <tr key={match.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{match.name}</p>
                      <p className="text-xs text-muted-foreground">{match.team1} vs {match.team2}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-medium text-brand-teal">{match.matchWinner || '-'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">{match.totalBetsCount || 0}</td>
                    <td className="px-4 py-2.5 text-sm">{formatCurrency(Number(match.totalBetsAmount || 0))}</td>
                    <td className="px-4 py-2.5">
                      {match.isSettled ? (
                        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Settled</span>
                      ) : (
                        <span className="text-xs text-yellow-600">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(match.startTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

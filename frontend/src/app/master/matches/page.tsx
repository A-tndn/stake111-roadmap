'use client';

import { useEffect, useState } from 'react';
import { masterService } from '@/services/master.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trophy, RefreshCw } from 'lucide-react';

export default function MasterMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    try {
      const res: any = await masterService.getAllMatches({ limit: 100 });
      const data = res?.data?.matches || res?.data || [];
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load matches', err); }
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await masterService.importMatchesFromAPI();
      setMessage({ type: 'success', text: 'Matches imported from API' });
      loadMatches();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to import' });
    } finally { setImporting(false); }
  };

  const statusColors: Record<string, string> = {
    LIVE: 'bg-red-100 text-red-700',
    UPCOMING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-muted text-foreground',
  };

  const filtered = filterStatus === 'ALL' ? matches : matches.filter((m: any) => m.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-gold" /> All Matches
        </h2>
        <div className="flex gap-2">
          <button onClick={handleImport} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
            <RefreshCw className={cn('w-4 h-4', importing && 'animate-spin')} /> Import from API
          </button>
        </div>
      </div>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'LIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
              filterStatus === status ? 'bg-brand-gold text-white' : 'bg-card border text-muted-foreground hover:bg-muted'
            )}>
            {status}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No matches found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Match', 'Status', 'Date', 'Winner', 'Bets', 'Volume', 'Settled'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((m: any) => (
                  <tr key={m.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{m.teamA} vs {m.teamB}</p>
                      <p className="text-xs text-muted-foreground">{m.league || m.seriesName}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[m.status] || 'bg-muted text-foreground')}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(m.matchDate || m.startTime)}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{m.matchWinner || '-'}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{m._count?.bets || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-medium">{formatCurrency(Number(m.totalBetVolume || 0))}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                        m.isSettled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {m.isSettled ? 'Yes' : 'No'}
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

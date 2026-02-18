'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Activity, Lock, Unlock, Settings, Eye } from 'lucide-react';

export default function CurrentMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    try {
      const res: any = await adminService.getCurrentMatches();
      const data = res?.data?.matches || res?.data || [];
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBetting = async (id: string) => {
    try {
      await adminService.toggleMatchBetting(id);
      setMessage({ type: 'success', text: 'Betting toggle updated' });
      loadMatches();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-inplay" /> Current Matches
      </h2>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-xl border h-20 animate-pulse" />)}</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No current matches</div>
      ) : (
        <div className="space-y-3">
          {matches.map((match: any) => (
            <div key={match.id} className={cn('bg-card rounded-xl border p-4', match.status === 'LIVE' && 'border-l-4 border-l-inplay')}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full',
                      match.status === 'LIVE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>
                      {match.status}
                    </span>
                    <span className="text-xs text-muted-foreground/70">{match.matchType}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{match.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {match.team1} vs {match.team2} - {formatDate(match.startTime)}
                  </p>
                  {match.team1Score && (
                    <p className="text-xs text-brand-teal font-semibold mt-1">
                      {match.team1Score} | {match.team2Score}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-3">
                  <button onClick={() => handleToggleBetting(match.id)}
                    title={match.bettingLocked ? 'Unlock betting' : 'Lock betting'}
                    className={cn('p-2 rounded-lg border transition',
                      match.bettingLocked ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100' : 'text-green-500 border-green-200 bg-green-50 hover:bg-green-100')}>
                    {match.bettingLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button onClick={() => router.push(`/agent/matches/${match.id}`)}
                    className="p-2 rounded-lg border border-border text-brand-teal hover:bg-muted transition">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Odds preview */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">{match.team1?.split(' ').pop()}</p>
                  <div className="flex gap-1 justify-center mt-1">
                    <span className="bg-back text-xs font-bold px-2 py-0.5 rounded">{match.team1BackOdds?.toFixed(2) || '-'}</span>
                    <span className="bg-lay text-xs font-bold px-2 py-0.5 rounded">{match.team1LayOdds?.toFixed(2) || '-'}</span>
                  </div>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Draw</p>
                  <div className="flex gap-1 justify-center mt-1">
                    <span className="bg-back text-xs font-bold px-2 py-0.5 rounded">{match.drawBackOdds?.toFixed(2) || '-'}</span>
                    <span className="bg-lay text-xs font-bold px-2 py-0.5 rounded">{match.drawLayOdds?.toFixed(2) || '-'}</span>
                  </div>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground">{match.team2?.split(' ').pop()}</p>
                  <div className="flex gap-1 justify-center mt-1">
                    <span className="bg-back text-xs font-bold px-2 py-0.5 rounded">{match.team2BackOdds?.toFixed(2) || '-'}</span>
                    <span className="bg-lay text-xs font-bold px-2 py-0.5 rounded">{match.team2LayOdds?.toFixed(2) || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

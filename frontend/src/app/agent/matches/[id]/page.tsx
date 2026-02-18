'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { matchService } from '@/services/match.service';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, Trophy, AlertTriangle } from 'lucide-react';

export default function MatchManagePage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const [match, setMatch] = useState<any>(null);
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [oddsForm, setOddsForm] = useState({
    team1BackOdds: '', team1LayOdds: '', team2BackOdds: '', team2LayOdds: '', drawBackOdds: '', drawLayOdds: '',
  });
  const [settleForm, setSettleForm] = useState({ winner: '' });

  useEffect(() => { loadData(); }, [matchId]);

  const loadData = async () => {
    try {
      const [matchRes, betsRes] = await Promise.all([
        matchService.getMatchById(matchId),
        adminService.getMatchBets(matchId, { limit: 50 }).catch(() => null),
      ]);
      const m = (matchRes as any).data || matchRes;
      setMatch(m);
      setBets((betsRes as any)?.data?.bets || (betsRes as any)?.data || []);
      setOddsForm({
        team1BackOdds: m.team1BackOdds?.toString() || '',
        team1LayOdds: m.team1LayOdds?.toString() || '',
        team2BackOdds: m.team2BackOdds?.toString() || '',
        team2LayOdds: m.team2LayOdds?.toString() || '',
        drawBackOdds: m.drawBackOdds?.toString() || '',
        drawLayOdds: m.drawLayOdds?.toString() || '',
      });
    } catch (err) { console.error('Failed to load match', err); }
    finally { setLoading(false); }
  };

  const handleSaveOdds = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const data: any = {};
      Object.entries(oddsForm).forEach(([k, v]) => { if (v) data[k] = parseFloat(v); });
      await adminService.updateMatchOdds(matchId, data);
      setMessage({ type: 'success', text: 'Odds updated' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update odds' });
    } finally { setSaving(false); }
  };

  const handleSettle = async () => {
    if (!settleForm.winner) { setMessage({ type: 'error', text: 'Select a winner' }); return; }
    setSettling(true);
    try {
      await adminService.settleMatch(matchId, { winner: settleForm.winner });
      setMessage({ type: 'success', text: 'Match settled!' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Settlement failed' });
    } finally { setSettling(false); }
  };

  const handleVoid = async () => {
    if (!confirm('Void all bets for this match? This will refund all pending bets.')) return;
    try {
      await adminService.voidMatch(matchId, 'Voided by admin');
      setMessage({ type: 'success', text: 'Match voided and bets refunded' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to void' });
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>;
  if (!match) return <div className="text-center py-12 text-muted-foreground text-sm">Match not found</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Match header */}
      <div className="bg-card rounded-xl border p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full',
            match.status === 'LIVE' ? 'bg-red-100 text-red-700' :
            match.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
            {match.status}
          </span>
          {match.isSettled && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Settled</span>}
        </div>
        <h2 className="text-lg font-bold text-foreground">{match.name}</h2>
        <p className="text-sm text-muted-foreground">{match.team1} vs {match.team2} - {formatDate(match.startTime)}</p>
      </div>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Odds editor */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-foreground text-sm mb-3">Edit Odds</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: `${match.team1} Back`, key: 'team1BackOdds', color: 'border-back' },
              { label: `${match.team1} Lay`, key: 'team1LayOdds', color: 'border-lay' },
              { label: `${match.team2} Back`, key: 'team2BackOdds', color: 'border-back' },
              { label: `${match.team2} Lay`, key: 'team2LayOdds', color: 'border-lay' },
              { label: 'Draw Back', key: 'drawBackOdds', color: 'border-back' },
              { label: 'Draw Lay', key: 'drawLayOdds', color: 'border-lay' },
            ].map(({ label, key, color }) => (
              <div key={key}>
                <label className="block text-xs text-muted-foreground mb-1">{label}</label>
                <input type="number" step="0.01" value={(oddsForm as any)[key]}
                  onChange={(e) => setOddsForm({ ...oddsForm, [key]: e.target.value })}
                  className={cn('w-full px-3 py-2 border-2 rounded-lg text-sm font-bold focus:outline-none', color)} />
              </div>
            ))}
          </div>
          <button onClick={handleSaveOdds} disabled={saving}
            className="mt-3 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Update Odds'}
          </button>
        </div>

        {/* Settlement */}
        {!match.isSettled && (
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Settle Match
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Winner</label>
                <select value={settleForm.winner} onChange={(e) => setSettleForm({ winner: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select winner...</option>
                  <option value={match.team1}>{match.team1}</option>
                  <option value={match.team2}>{match.team2}</option>
                  <option value="DRAW">Draw</option>
                </select>
              </div>
              <button onClick={handleSettle} disabled={settling}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> {settling ? 'Settling...' : 'Settle Match'}
              </button>
              <button onClick={handleVoid}
                className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Void Match (Refund All)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bets on this match */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold text-foreground text-sm">Bets ({bets.length})</h3></div>
        {bets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No bets on this match</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['User', 'Type', 'Selection', 'B/L', 'Amount', 'Odds', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {bets.slice(0, 30).map((bet: any) => (
                  <tr key={bet.id} className="hover:bg-muted text-xs">
                    <td className="px-4 py-2 text-sm">{bet.user?.displayName || bet.userId}</td>
                    <td className="px-4 py-2">{bet.betType}</td>
                    <td className="px-4 py-2 font-medium">{bet.betOn}</td>
                    <td className="px-4 py-2">
                      <span className={cn('font-medium', bet.isBack ? 'text-blue-600' : 'text-red-500')}>
                        {bet.isBack ? 'BACK' : 'LAY'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">{formatCurrency(Number(bet.amount))}</td>
                    <td className="px-4 py-2">{Number(bet.odds).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium',
                        bet.status === 'WON' ? 'bg-green-100 text-green-700' :
                        bet.status === 'LOST' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700')}>
                        {bet.status}
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

'use client';

import { useEffect, useState } from 'react';
import { matchService } from '@/services/match.service';
import { useMatchStore } from '@/store/matchStore';
import MatchCard from '@/components/betting/MatchCard';
import BetSlip from '@/components/betting/BetSlip';
import { Activity } from 'lucide-react';

export default function InplayPage() {
  const { liveMatches, setMatches } = useMatchStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadMatches = async () => {
    try {
      await matchService.getMatches({ status: 'LIVE' });
      const all: any = await matchService.getMatches();
      const allData = all?.data || all?.matches || all || [];
      setMatches(Array.isArray(allData) ? allData : []);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-inplay" />
          In-Play Matches
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Live matches with real-time odds</p>
      </div>

      <div className="px-3 pb-4 space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg border h-28 animate-pulse" />
          ))
        ) : liveMatches.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No live matches right now</p>
            <p className="text-muted-foreground/70 text-xs mt-1">Check back when matches are in progress</p>
          </div>
        ) : (
          liveMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        )}
      </div>

      <BetSlip />
    </div>
  );
}

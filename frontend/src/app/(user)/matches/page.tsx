'use client';

import { useEffect, useState } from 'react';
import { matchService } from '@/services/match.service';
import { useMatchStore } from '@/store/matchStore';
import MatchCard from '@/components/betting/MatchCard';
import BetSlip from '@/components/betting/BetSlip';
import { cn } from '@/lib/utils';

const FILTERS = ['all', 'LIVE', 'UPCOMING', 'COMPLETED'];

export default function MatchesPage() {
  const { matches, filter, setMatches, setFilter } = useMatchStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res: any = await matchService.getMatches();
      const data = res?.data || res?.matches || res || [];
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? matches
    : matches.filter((m) => m.status === filter);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Filter tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
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

      {/* Match list */}
      <div className="px-3 pb-4 space-y-2">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-lg border h-28 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No matches found
          </div>
        ) : (
          filtered.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        )}
      </div>

      <BetSlip />
    </div>
  );
}

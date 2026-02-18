'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { matchService } from '@/services/match.service';
import { useMatchStore } from '@/store/matchStore';
import MatchCard from '@/components/betting/MatchCard';
import BetSlip from '@/components/betting/BetSlip';
import { Activity, Trophy, Gamepad2, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { liveMatches, upcomingMatches, setMatches } = useMatchStore();
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Quick access tabs */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <button
          onClick={() => router.push('/inplay')}
          className="flex items-center gap-2 bg-card rounded-lg p-3 border shadow-sm hover:shadow-md transition"
        >
          <Activity className="w-5 h-5 text-inplay" />
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">In-Play</p>
            <p className="text-[10px] text-muted-foreground">{liveMatches.length} live</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/matches')}
          className="flex items-center gap-2 bg-card rounded-lg p-3 border shadow-sm hover:shadow-md transition"
        >
          <Trophy className="w-5 h-5 text-brand-teal" />
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Cricket</p>
            <p className="text-[10px] text-muted-foreground">{upcomingMatches.length} upcoming</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/casino')}
          className="flex items-center gap-2 bg-card rounded-lg p-3 border shadow-sm hover:shadow-md transition"
        >
          <Gamepad2 className="w-5 h-5 text-brand-orange" />
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Casino</p>
            <p className="text-[10px] text-muted-foreground">Games</p>
          </div>
        </button>
      </div>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="px-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-inplay" />
              Live Matches
            </h2>
            <button
              onClick={() => router.push('/inplay')}
              className="text-xs text-brand-teal font-medium flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming matches */}
      <section className="px-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-brand-teal" />
            Upcoming Matches
          </h2>
          <button
            onClick={() => router.push('/matches')}
            className="text-xs text-brand-teal font-medium flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg border h-28 animate-pulse" />
            ))}
          </div>
        ) : upcomingMatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No upcoming matches
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingMatches.slice(0, 10).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* Bet slip */}
      <BetSlip />
    </div>
  );
}

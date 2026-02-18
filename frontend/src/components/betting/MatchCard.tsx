'use client';

import { useRouter } from 'next/navigation';
import { useBetStore } from '@/store/betStore';
import OddsBox from './OddsBox';
import InplayIndicator from './InplayIndicator';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: {
    id: string;
    name: string;
    shortName?: string;
    team1: string;
    team2: string;
    tournament?: string;
    status: string;
    startTime: string;
    team1Score?: string;
    team2Score?: string;
    team1BackOdds?: number;
    team1LayOdds?: number;
    team2BackOdds?: number;
    team2LayOdds?: number;
    drawBackOdds?: number;
    drawLayOdds?: number;
    bettingLocked?: boolean;
  };
  compact?: boolean;
}

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const router = useRouter();
  const { addToBetSlip } = useBetStore();
  const isLive = match.status === 'LIVE';
  const locked = match.bettingLocked || match.status === 'COMPLETED' || match.status === 'CANCELLED';

  const handleOddsClick = (team: string, odds: number, isBack: boolean) => {
    if (locked) return;
    addToBetSlip({
      matchId: match.id,
      matchName: match.name,
      betType: 'MATCH_WINNER',
      betOn: team,
      odds,
      isBack,
    });
  };

  return (
    <div
      className={cn(
        'bg-card rounded-lg border shadow-sm overflow-hidden transition hover:shadow-md',
        isLive && 'border-l-4 border-l-inplay'
      )}
    >
      {/* Header: tournament + status */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b">
        <span className="text-[11px] text-muted-foreground truncate">
          {match.tournament || 'Cricket'}
        </span>
        {isLive ? (
          <InplayIndicator />
        ) : match.status === 'UPCOMING' ? (
          <span className="text-[10px] text-muted-foreground">
            {new Date(match.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">{match.status}</span>
        )}
      </div>

      {/* Match info clickable → detail page */}
      <div
        className="px-3 py-2 cursor-pointer"
        onClick={() => router.push(`/matches/${match.id}`)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{match.team1}</p>
            {match.team1Score && isLive && (
              <p className="text-xs text-brand-teal font-semibold">{match.team1Score}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground px-2">vs</span>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-sm font-medium text-foreground truncate">{match.team2}</p>
            {match.team2Score && isLive && (
              <p className="text-xs text-brand-teal font-semibold">{match.team2Score}</p>
            )}
          </div>
        </div>
      </div>

      {/* Odds grid: 3 columns (team1, draw, team2), each with back+lay */}
      {!compact && (
        <div className="px-3 pb-2">
          {/* Labels row */}
          <div className="grid grid-cols-3 gap-1 mb-1">
            <div className="text-center">
              <span className="text-[9px] text-muted-foreground">{match.team1.split(' ').pop()}</span>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-muted-foreground">Draw</span>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-muted-foreground">{match.team2.split(' ').pop()}</span>
            </div>
          </div>

          {/* Odds boxes */}
          <div className="grid grid-cols-3 gap-1">
            {/* Team 1 */}
            <div className="flex gap-0.5">
              <OddsBox
                odds={match.team1BackOdds}
                isBack={true}
                size="sm"
                locked={locked}
                onClick={() => match.team1BackOdds && handleOddsClick(match.team1, match.team1BackOdds, true)}
              />
              <OddsBox
                odds={match.team1LayOdds}
                isBack={false}
                size="sm"
                locked={locked}
                onClick={() => match.team1LayOdds && handleOddsClick(match.team1, match.team1LayOdds, false)}
              />
            </div>

            {/* Draw */}
            <div className="flex gap-0.5">
              <OddsBox
                odds={match.drawBackOdds}
                isBack={true}
                size="sm"
                locked={locked}
                onClick={() => match.drawBackOdds && handleOddsClick('DRAW', match.drawBackOdds, true)}
              />
              <OddsBox
                odds={match.drawLayOdds}
                isBack={false}
                size="sm"
                locked={locked}
                onClick={() => match.drawLayOdds && handleOddsClick('DRAW', match.drawLayOdds, false)}
              />
            </div>

            {/* Team 2 */}
            <div className="flex gap-0.5">
              <OddsBox
                odds={match.team2BackOdds}
                isBack={true}
                size="sm"
                locked={locked}
                onClick={() => match.team2BackOdds && handleOddsClick(match.team2, match.team2BackOdds, true)}
              />
              <OddsBox
                odds={match.team2LayOdds}
                isBack={false}
                size="sm"
                locked={locked}
                onClick={() => match.team2LayOdds && handleOddsClick(match.team2, match.team2LayOdds, false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

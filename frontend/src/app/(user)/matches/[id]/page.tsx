'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { matchService } from '@/services/match.service';
import { useBetStore } from '@/store/betStore';
import { useSocket } from '@/hooks/useSocket';
import OddsBox from '@/components/betting/OddsBox';
import InplayIndicator from '@/components/betting/InplayIndicator';
import BetSlip from '@/components/betting/BetSlip';
import { formatDate } from '@/lib/utils';
import { MapPin, Clock, Trophy } from 'lucide-react';

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToBetSlip } = useBetStore();
  const { joinMatch, leaveMatch } = useSocket();

  useEffect(() => {
    loadMatch();
    joinMatch(matchId);
    return () => leaveMatch(matchId);
  }, [matchId]);

  const loadMatch = async () => {
    try {
      const res: any = await matchService.getMatchById(matchId);
      setMatch(res?.data || res);
    } catch (err) {
      console.error('Failed to load match', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-card rounded-lg h-64 animate-pulse" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center text-muted-foreground">
        Match not found
      </div>
    );
  }

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
    <div className="max-w-3xl mx-auto">
      {/* Match header */}
      <div className="bg-brand-teal-dark text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs bg-card/20 px-2 py-0.5 rounded">{match.matchType}</span>
          {isLive ? <InplayIndicator className="text-white [&_span]:text-white" /> : (
            <span className="text-xs text-white/70">{match.status}</span>
          )}
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <p className="text-lg font-bold">{match.team1}</p>
            {match.team1Score && <p className="text-sm text-brand-orange font-semibold">{match.team1Score}</p>}
          </div>
          <div className="px-4 text-center">
            <span className="text-xs text-white/50">VS</span>
          </div>
          <div className="flex-1 text-right">
            <p className="text-lg font-bold">{match.team2}</p>
            {match.team2Score && <p className="text-sm text-brand-orange font-semibold">{match.team2Score}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/70">
          {match.tournament && (
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{match.tournament}</span>
          )}
          {match.venue && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.venue}</span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(match.startTime)}</span>
        </div>
      </div>

      {/* Match Winner Market */}
      <div className="p-3">
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="bg-muted px-4 py-2 border-b">
            <h3 className="text-sm font-bold text-foreground">Match Winner</h3>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[1fr_130px] px-4 py-1.5 border-b bg-muted/50">
            <span className="text-xs text-muted-foreground">Selection</span>
            <div className="grid grid-cols-2 gap-1 text-center">
              <span className="text-[10px] text-blue-600 font-medium">Back</span>
              <span className="text-[10px] text-red-400 font-medium">Lay</span>
            </div>
          </div>

          {/* Team 1 */}
          <div className="grid grid-cols-[1fr_130px] items-center px-4 py-2 border-b hover:bg-muted transition">
            <span className="text-sm font-medium text-foreground">{match.team1}</span>
            <div className="grid grid-cols-2 gap-1">
              <OddsBox
                odds={match.team1BackOdds}
                isBack={true}
                locked={locked}
                onClick={() => match.team1BackOdds && handleOddsClick(match.team1, match.team1BackOdds, true)}
              />
              <OddsBox
                odds={match.team1LayOdds}
                isBack={false}
                locked={locked}
                onClick={() => match.team1LayOdds && handleOddsClick(match.team1, match.team1LayOdds, false)}
              />
            </div>
          </div>

          {/* Draw */}
          {(match.drawBackOdds || match.drawLayOdds) && (
            <div className="grid grid-cols-[1fr_130px] items-center px-4 py-2 border-b hover:bg-muted transition">
              <span className="text-sm font-medium text-foreground">Draw</span>
              <div className="grid grid-cols-2 gap-1">
                <OddsBox
                  odds={match.drawBackOdds}
                  isBack={true}
                  locked={locked}
                  onClick={() => match.drawBackOdds && handleOddsClick('DRAW', match.drawBackOdds, true)}
                />
                <OddsBox
                  odds={match.drawLayOdds}
                  isBack={false}
                  locked={locked}
                  onClick={() => match.drawLayOdds && handleOddsClick('DRAW', match.drawLayOdds, false)}
                />
              </div>
            </div>
          )}

          {/* Team 2 */}
          <div className="grid grid-cols-[1fr_130px] items-center px-4 py-2 hover:bg-muted transition">
            <span className="text-sm font-medium text-foreground">{match.team2}</span>
            <div className="grid grid-cols-2 gap-1">
              <OddsBox
                odds={match.team2BackOdds}
                isBack={true}
                locked={locked}
                onClick={() => match.team2BackOdds && handleOddsClick(match.team2, match.team2BackOdds, true)}
              />
              <OddsBox
                odds={match.team2LayOdds}
                isBack={false}
                locked={locked}
                onClick={() => match.team2LayOdds && handleOddsClick(match.team2, match.team2LayOdds, false)}
              />
            </div>
          </div>
        </div>

        {locked && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center text-sm text-yellow-700">
            {match.status === 'COMPLETED' ? 'This match has ended' :
             match.status === 'CANCELLED' ? 'This match was cancelled' :
             'Betting is currently locked for this match'}
          </div>
        )}
      </div>

      <BetSlip />
    </div>
  );
}

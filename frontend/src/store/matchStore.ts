'use client';

import { create } from 'zustand';

interface Match {
  id: string;
  name: string;
  shortName: string;
  team1: string;
  team2: string;
  tournament: string;
  matchType: string;
  status: string;
  startTime: string;
  venue?: string;
  team1Score?: string;
  team2Score?: string;
  team1BackOdds?: number;
  team1LayOdds?: number;
  team2BackOdds?: number;
  team2LayOdds?: number;
  drawBackOdds?: number;
  drawLayOdds?: number;
  bettingLocked?: boolean;
  matchWinner?: string;
  totalBetsCount?: number;
}

interface MatchStore {
  matches: Match[];
  liveMatches: Match[];
  upcomingMatches: Match[];
  filter: string;

  setMatches: (matches: Match[]) => void;
  setFilter: (filter: string) => void;
  updateMatchOdds: (matchId: string, odds: Partial<Match>) => void;
  updateMatchStatus: (matchId: string, status: string) => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  matches: [],
  liveMatches: [],
  upcomingMatches: [],
  filter: 'all',

  setMatches: (matches) =>
    set({
      matches,
      liveMatches: matches.filter((m) => m.status === 'LIVE'),
      upcomingMatches: matches.filter((m) => m.status === 'UPCOMING'),
    }),

  setFilter: (filter) => set({ filter }),

  updateMatchOdds: (matchId, odds) =>
    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId ? { ...m, ...odds } : m
      ),
      liveMatches: state.liveMatches.map((m) =>
        m.id === matchId ? { ...m, ...odds } : m
      ),
    })),

  updateMatchStatus: (matchId, status) =>
    set((state) => {
      const updated = state.matches.map((m) =>
        m.id === matchId ? { ...m, status } : m
      );
      return {
        matches: updated,
        liveMatches: updated.filter((m) => m.status === 'LIVE'),
        upcomingMatches: updated.filter((m) => m.status === 'UPCOMING'),
      };
    }),
}));

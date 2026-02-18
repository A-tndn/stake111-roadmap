'use client';

import { cn } from '@/lib/utils';

interface CardGameProps {
  result: any | null;
  selectedBet: string;
  onSelectBet: (betType: string) => void;
  isPlaying: boolean;
  gameType: 'TEEN_PATTI' | 'INDIAN_POKER';
}

export default function CardGame({ result, selectedBet, onSelectBet, isPlaying }: CardGameProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Card Table */}
      <div className="w-full max-w-md mb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Player A */}
          <div className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            result && !isPlaying && result.winner === 'PLAYER_A' ? 'border-green-500 bg-green-50' : 'border-border bg-muted'
          )}>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Player A</p>
            <div className="flex justify-center gap-1.5 mb-2">
              {result && !isPlaying ? (
                result.playerA?.cards?.map((card: string, i: number) => (
                  <div key={i} className="w-10 h-14 bg-card rounded-lg border shadow-sm flex items-center justify-center text-sm font-bold text-foreground">
                    {card}
                  </div>
                ))
              ) : (
                [0, 1, 2].map((i) => (
                  <div key={i} className={cn(
                    'w-10 h-14 rounded-lg border flex items-center justify-center text-sm',
                    isPlaying ? 'bg-brand-gold/20 border-brand-gold animate-pulse' : 'bg-blue-100 border-blue-200'
                  )}>
                    {isPlaying ? '?' : '🂠'}
                  </div>
                ))
              )}
            </div>
            {result && !isPlaying && result.winner === 'PLAYER_A' && (
              <span className="text-xs font-bold text-green-600">WINNER!</span>
            )}
          </div>

          {/* Player B */}
          <div className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            result && !isPlaying && result.winner === 'PLAYER_B' ? 'border-green-500 bg-green-50' : 'border-border bg-muted'
          )}>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Player B</p>
            <div className="flex justify-center gap-1.5 mb-2">
              {result && !isPlaying ? (
                result.playerB?.cards?.map((card: string, i: number) => (
                  <div key={i} className="w-10 h-14 bg-card rounded-lg border shadow-sm flex items-center justify-center text-sm font-bold text-foreground">
                    {card}
                  </div>
                ))
              ) : (
                [0, 1, 2].map((i) => (
                  <div key={i} className={cn(
                    'w-10 h-14 rounded-lg border flex items-center justify-center text-sm',
                    isPlaying ? 'bg-brand-gold/20 border-brand-gold animate-pulse' : 'bg-red-100 border-red-200'
                  )} style={{ animationDelay: `${i * 0.1}s` }}>
                    {isPlaying ? '?' : '🂠'}
                  </div>
                ))
              )}
            </div>
            {result && !isPlaying && result.winner === 'PLAYER_B' && (
              <span className="text-xs font-bold text-green-600">WINNER!</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">Pick the hand you think will win</p>

      {/* Bet Selection */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <button
          onClick={() => onSelectBet('PLAYER_A')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'PLAYER_A'
              ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-blue-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-3xl block mb-1">🔵</span>
          <span className="text-sm font-semibold text-foreground">Player A</span>
          <span className="text-xs text-muted-foreground block">1.95x</span>
        </button>

        <button
          onClick={() => onSelectBet('PLAYER_B')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'PLAYER_B'
              ? 'border-red-500 bg-red-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-red-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-3xl block mb-1">🔴</span>
          <span className="text-sm font-semibold text-foreground">Player B</span>
          <span className="text-xs text-muted-foreground block">1.95x</span>
        </button>
      </div>
    </div>
  );
}

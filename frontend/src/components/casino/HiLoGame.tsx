'use client';

import { cn } from '@/lib/utils';

interface HiLoGameProps {
  result: any | null;
  selectedBet: string;
  onSelectBet: (betType: string) => void;
  isPlaying: boolean;
}

export default function HiLoGame({ result, selectedBet, onSelectBet, isPlaying }: HiLoGameProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Card Display */}
      <div className={cn(
        'w-28 h-40 rounded-xl border-2 flex flex-col items-center justify-center mb-6 transition-all duration-500',
        isPlaying ? 'animate-pulse border-brand-gold bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-card border-border',
        result && !isPlaying && 'border-brand-teal bg-gradient-to-br from-teal-50 to-green-50'
      )}>
        {isPlaying ? (
          <span className="text-4xl">🃏</span>
        ) : result ? (
          <>
            <span className="text-lg">{result.suit}</span>
            <span className="text-3xl font-bold text-foreground">{result.cardName}</span>
            <span className="text-sm text-muted-foreground">Value: {result.value}</span>
          </>
        ) : (
          <>
            <span className="text-4xl mb-1">🃏</span>
            <span className="text-xs text-muted-foreground">Draw a card</span>
          </>
        )}
      </div>

      {/* Reference line */}
      <div className="w-full max-w-xs mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>A</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span className="text-brand-gold font-bold">7</span>
          <span>8</span>
          <span>9</span>
          <span>10</span>
          <span>J</span>
          <span>Q</span>
          <span>K</span>
        </div>
        <div className="relative h-1.5 bg-muted rounded-full">
          <div className="absolute left-0 w-[46%] h-full bg-blue-400 rounded-l-full" />
          <div className="absolute left-[46%] w-[8%] h-full bg-purple-400" />
          <div className="absolute right-0 w-[46%] h-full bg-red-400 rounded-r-full" />
          {result && !isPlaying && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-gold border-2 border-white rounded-full shadow"
              style={{ left: `${((result.value - 1) / 12) * 100}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span className="text-blue-500">LOW (&lt;7)</span>
          <span className="text-purple-500">= 7</span>
          <span className="text-red-500">HIGH (&gt;7)</span>
        </div>
      </div>

      {/* Bet Selection */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        <button
          onClick={() => onSelectBet('LOW')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'LOW'
              ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-blue-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-2xl block mb-1">⬇️</span>
          <span className="text-sm font-semibold text-foreground">Low</span>
          <span className="text-xs text-muted-foreground block">1.95x</span>
        </button>

        <button
          onClick={() => onSelectBet('EXACT')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'EXACT'
              ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-purple-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-2xl block mb-1">🎯</span>
          <span className="text-sm font-semibold text-foreground">Exact 7</span>
          <span className="text-xs text-muted-foreground block">13.0x</span>
        </button>

        <button
          onClick={() => onSelectBet('HIGH')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'HIGH'
              ? 'border-red-500 bg-red-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-red-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-2xl block mb-1">⬆️</span>
          <span className="text-sm font-semibold text-foreground">High</span>
          <span className="text-xs text-muted-foreground block">1.95x</span>
        </button>
      </div>
    </div>
  );
}

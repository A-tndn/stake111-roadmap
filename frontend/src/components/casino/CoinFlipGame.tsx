'use client';

import { cn } from '@/lib/utils';

interface CoinFlipGameProps {
  result: any | null;
  selectedBet: string;
  onSelectBet: (betType: string) => void;
  isPlaying: boolean;
}

export default function CoinFlipGame({ result, selectedBet, onSelectBet, isPlaying }: CoinFlipGameProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Coin Animation */}
      <div className={cn(
        'w-32 h-32 rounded-full flex items-center justify-center text-5xl border-4 mb-6 transition-all duration-500',
        isPlaying ? 'animate-spin border-brand-gold' : 'border-border',
        result?.outcome === 'HEADS' ? 'bg-yellow-100 border-yellow-400' :
        result?.outcome === 'TAILS' ? 'bg-muted border-gray-400' : 'bg-card'
      )}>
        {isPlaying ? '🪙' : result ? (result.outcome === 'HEADS' ? '👑' : '🌿') : '🪙'}
      </div>

      {/* Result Display */}
      {result && !isPlaying && (
        <div className="text-center mb-6">
          <p className="text-2xl font-bold text-foreground">{result.outcome}</p>
        </div>
      )}

      {/* Bet Selection */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <button
          onClick={() => onSelectBet('HEADS')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'HEADS'
              ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-yellow-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-3xl block mb-1">👑</span>
          <span className="text-sm font-semibold text-foreground">Heads</span>
          <span className="text-xs text-muted-foreground block">1.95x</span>
        </button>

        <button
          onClick={() => onSelectBet('TAILS')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'TAILS'
              ? 'border-green-500 bg-green-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-green-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-3xl block mb-1">🌿</span>
          <span className="text-sm font-semibold text-foreground">Tails</span>
          <span className="text-xs text-muted-foreground block">1.95x</span>
        </button>
      </div>
    </div>
  );
}

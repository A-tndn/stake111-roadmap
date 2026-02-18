'use client';

import { cn } from '@/lib/utils';

interface DiceGameProps {
  result: any | null;
  selectedBet: string;
  onSelectBet: (betType: string) => void;
  isPlaying: boolean;
}

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceGame({ result, selectedBet, onSelectBet, isPlaying }: DiceGameProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Dice Display */}
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          'w-20 h-20 rounded-xl flex items-center justify-center text-4xl border-2 transition-all duration-300',
          isPlaying ? 'animate-bounce border-brand-gold bg-yellow-50' : 'border-border bg-card',
          result && !isPlaying && 'border-brand-teal bg-teal-50'
        )}>
          {isPlaying ? '🎲' : result ? DICE_FACES[result.dice1] || result.dice1 : '⚃'}
        </div>
        <span className="text-2xl font-bold text-muted-foreground">+</span>
        <div className={cn(
          'w-20 h-20 rounded-xl flex items-center justify-center text-4xl border-2 transition-all duration-300',
          isPlaying ? 'animate-bounce border-brand-gold bg-yellow-50' : 'border-border bg-card',
          result && !isPlaying && 'border-brand-teal bg-teal-50'
        )} style={{ animationDelay: '0.1s' }}>
          {isPlaying ? '🎲' : result ? DICE_FACES[result.dice2] || result.dice2 : '⚄'}
        </div>
      </div>

      {/* Total */}
      {result && !isPlaying && (
        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-foreground">Total: {result.total}</p>
          <p className="text-sm text-muted-foreground">Target: 7</p>
        </div>
      )}

      {!result && !isPlaying && (
        <p className="text-sm text-muted-foreground mb-4">Roll target: 7</p>
      )}

      {/* Bet Selection */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        <button
          onClick={() => onSelectBet('UNDER')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'UNDER'
              ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-blue-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-2xl block mb-1">⬇️</span>
          <span className="text-sm font-semibold text-foreground">Under 7</span>
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
          <span className="text-xs text-muted-foreground block">6.0x</span>
        </button>

        <button
          onClick={() => onSelectBet('OVER')}
          disabled={isPlaying}
          className={cn(
            'p-4 rounded-xl border-2 text-center transition-all',
            selectedBet === 'OVER'
              ? 'border-red-500 bg-red-50 shadow-lg scale-105'
              : 'border-border bg-card hover:border-red-300',
            isPlaying && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-2xl block mb-1">⬆️</span>
          <span className="text-sm font-semibold text-foreground">Over 7</span>
          <span className="text-xs text-muted-foreground block">1.95x</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useBetStore } from '@/store/betStore';
import { useAuthStore } from '@/store/authStore';
import { betService } from '@/services/bet.service';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { X, Minus, Plus } from 'lucide-react';

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export default function BetSlip() {
  const { betSlip, isOpen, isSubmitting, updateAmount, clearBetSlip, setSubmitting } = useBetStore();
  const { user } = useAuthStore();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!betSlip || !isOpen) return null;

  const potentialWin = betSlip.amount * betSlip.odds;
  const potentialProfit = potentialWin - betSlip.amount;

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (betSlip.amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (user?.balance !== undefined && betSlip.amount > user.balance) {
      setError('Insufficient balance');
      return;
    }

    setSubmitting(true);
    try {
      await betService.placeBet({
        matchId: betSlip.matchId,
        betType: betSlip.betType,
        betOn: betSlip.betOn,
        amount: betSlip.amount,
        odds: betSlip.odds,
      });
      setSuccess('Bet placed successfully!');
      setTimeout(() => clearBetSlip(), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place bet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:bottom-auto md:right-4 md:left-auto md:top-20 md:w-96">
      <div className="animate-slide-up bg-card border-t md:border md:rounded-xl shadow-2xl">
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-4 py-2.5',
          betSlip.isBack ? 'bg-back' : 'bg-lay'
        )}>
          <div>
            <span className="text-xs font-medium text-foreground">
              {betSlip.isBack ? 'BACK' : 'LAY'} - {betSlip.betOn}
            </span>
            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{betSlip.matchName}</p>
          </div>
          <button onClick={clearBetSlip} className="p-1 hover:bg-black/10 rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Odds display */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Odds</span>
            <span className="font-bold text-lg text-brand-teal">{betSlip.odds.toFixed(2)}</span>
          </div>

          {/* Amount input */}
          <div className="mb-3">
            <label className="text-sm text-muted-foreground mb-1 block">Stake Amount</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateAmount(Math.max(0, betSlip.amount - 100))}
                className="p-2 bg-muted rounded-lg hover:bg-muted/70 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={betSlip.amount || ''}
                onChange={(e) => updateAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="flex-1 text-center text-lg font-bold border rounded-lg py-2 px-3 focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
              />
              <button
                onClick={() => updateAmount(betSlip.amount + 100)}
                className="p-2 bg-muted rounded-lg hover:bg-muted/70 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => updateAmount(amt)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition whitespace-nowrap',
                  betSlip.amount === amt
                    ? 'bg-brand-teal text-white border-brand-teal'
                    : 'bg-muted text-foreground border-border hover:bg-muted'
                )}
              >
                {amt >= 1000 ? `${amt / 1000}K` : amt}
              </button>
            ))}
          </div>

          {/* Potential returns */}
          <div className="bg-muted rounded-lg p-3 mb-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential Win</span>
              <span className="font-semibold">{formatCurrency(potentialWin)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profit</span>
              <span className="font-semibold text-brand-green">
                +{formatCurrency(potentialProfit > 0 ? potentialProfit : 0)}
              </span>
            </div>
          </div>

          {/* Error/Success */}
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {success && <p className="text-sm text-green-600 mb-2">{success}</p>}

          {/* Place bet button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || betSlip.amount <= 0}
            className={cn(
              'w-full py-3 rounded-lg text-sm font-bold text-white transition',
              betSlip.isBack
                ? 'bg-back-dark hover:bg-blue-500'
                : 'bg-lay-dark hover:bg-red-500',
              (isSubmitting || betSlip.amount <= 0) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? 'Placing Bet...' : `Place ${betSlip.isBack ? 'Back' : 'Lay'} Bet`}
          </button>
        </div>
      </div>
    </div>
  );
}

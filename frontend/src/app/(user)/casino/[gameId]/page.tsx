'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { casinoService } from '@/services/casino.service';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import CoinFlipGame from '@/components/casino/CoinFlipGame';
import DiceGame from '@/components/casino/DiceGame';
import HiLoGame from '@/components/casino/HiLoGame';
import CardGame from '@/components/casino/CardGame';
import { ArrowLeft, History, Shield, Wallet } from 'lucide-react';

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export default function GamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { user, updateBalance } = useAuthStore();

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [selectedBet, setSelectedBet] = useState('');
  const [amount, setAmount] = useState(100);
  const [result, setResult] = useState<any>(null);
  const [lastResults, setLastResults] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showHistory, setShowHistory] = useState(false);
  const [betHistory, setBetHistory] = useState<any[]>([]);

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    try {
      const res: any = await casinoService.getGameById(gameId);
      setGame(res?.data || null);
    } catch (err) {
      console.error('Failed to load game', err);
      setMessage({ type: 'error', text: 'Game not found' });
    } finally { setLoading(false); }
  };

  const loadBetHistory = async () => {
    try {
      const res: any = await casinoService.getBetHistory({ limit: 20 });
      const bets = res?.data?.bets || [];
      setBetHistory(bets.filter((b: any) => b.round?.game?.gameType === game?.gameType));
    } catch (err) { console.error('Failed to load history', err); }
  };

  const handlePlay = async () => {
    if (!selectedBet) {
      setMessage({ type: 'error', text: 'Please select a bet option' });
      return;
    }
    if (amount < Number(game?.minBet || 10)) {
      setMessage({ type: 'error', text: `Minimum bet is ₹${game?.minBet || 10}` });
      return;
    }
    if (amount > Number(game?.maxBet || 10000)) {
      setMessage({ type: 'error', text: `Maximum bet is ₹${game?.maxBet || 10000}` });
      return;
    }
    if ((user?.balance || 0) < amount) {
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    setPlaying(true);
    setResult(null);
    setMessage({ type: '', text: '' });

    try {
      const res: any = await casinoService.instantPlay({
        gameId,
        betType: selectedBet,
        amount,
      });
      const data = res?.data;

      // Delay reveal for animation effect
      await new Promise(r => setTimeout(r, 1500));

      setResult(data?.result);
      updateBalance(data?.newBalance);

      if (data?.isWinner) {
        setMessage({ type: 'success', text: `You won ${formatCurrency(data?.bet?.actualWin || 0)}!` });
      } else {
        setMessage({ type: 'error', text: `You lost ₹${amount}. Better luck next time!` });
      }

      // Track last results
      setLastResults(prev => [{
        result: data?.result,
        isWinner: data?.isWinner,
        amount: data?.bet?.amount,
        win: data?.bet?.actualWin,
        betType: selectedBet,
      }, ...prev].slice(0, 10));

    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to play' });
    } finally {
      setPlaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-brand-teal text-lg">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Game not found</p>
        <button onClick={() => router.back()} className="mt-2 text-brand-teal text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const gameType = game.gameType;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push('/casino')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80">
          <ArrowLeft className="w-4 h-4" /> Casino
        </button>
        <button
          onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadBetHistory(); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80"
        >
          <History className="w-4 h-4" /> History
        </button>
      </div>

      {/* Game Info */}
      <div className="bg-card rounded-2xl shadow-sm border p-6 mb-4">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground">{game.gameName}</h1>
          {game.description && <p className="text-sm text-muted-foreground mt-1">{game.description}</p>}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Provably Fair
            </span>
            <span>RTP: {Number(game.rtp)}%</span>
            <span>Min: ₹{Number(game.minBet)}</span>
          </div>
        </div>

        {/* Game-Specific Component */}
        {gameType === 'COIN_FLIP' && (
          <CoinFlipGame result={result} selectedBet={selectedBet} onSelectBet={setSelectedBet} isPlaying={playing} />
        )}
        {gameType === 'DICE_ROLL' && (
          <DiceGame result={result} selectedBet={selectedBet} onSelectBet={setSelectedBet} isPlaying={playing} />
        )}
        {gameType === 'HI_LO' && (
          <HiLoGame result={result} selectedBet={selectedBet} onSelectBet={setSelectedBet} isPlaying={playing} />
        )}
        {(gameType === 'TEEN_PATTI' || gameType === 'INDIAN_POKER') && (
          <CardGame result={result} selectedBet={selectedBet} onSelectBet={setSelectedBet} isPlaying={playing} gameType={gameType} />
        )}
      </div>

      {/* Bet Controls */}
      <div className="bg-card rounded-2xl shadow-sm border p-4 mb-4">
        {/* Balance */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" /> Balance
          </span>
          <span className="text-sm font-bold text-green-600">{formatCurrency(user?.balance || 0)}</span>
        </div>

        {/* Amount Input */}
        <div className="mb-3">
          <label className="block text-xs text-muted-foreground mb-1">Bet Amount</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setAmount(Math.max(Number(game.minBet), amount - 100))}
              className="px-3 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/70 transition" disabled={playing}>
              -100
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={Number(game.minBet)}
              max={Number(game.maxBet)}
              disabled={playing}
              className="flex-1 px-3 py-2 border rounded-lg text-center text-sm font-bold focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
            />
            <button onClick={() => setAmount(Math.min(Number(game.maxBet), amount + 100))}
              className="px-3 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/70 transition" disabled={playing}>
              +100
            </button>
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="flex gap-2 mb-4">
          {QUICK_AMOUNTS.filter(a => a <= Number(game.maxBet)).map((a) => (
            <button key={a} onClick={() => setAmount(a)} disabled={playing}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition',
                amount === a ? 'bg-brand-teal text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}>
              {a >= 1000 ? `${a / 1000}K` : a}
            </button>
          ))}
        </div>

        {/* Potential Win */}
        {selectedBet && (
          <div className="flex justify-between text-sm mb-3 p-2 bg-green-50 rounded-lg">
            <span className="text-green-700">Potential Win:</span>
            <span className="font-bold text-green-700">
              {formatCurrency(amount * (
                gameType === 'HI_LO' && selectedBet === 'EXACT' ? 13.0 :
                gameType === 'DICE_ROLL' && selectedBet === 'EXACT' ? 6.0 : 1.95
              ))}
            </span>
          </div>
        )}

        {/* Message */}
        {message.text && (
          <div className={cn('mb-3 p-2 rounded-lg text-sm text-center font-medium',
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {message.text}
          </div>
        )}

        {/* Play Button */}
        <button
          onClick={handlePlay}
          disabled={playing || !selectedBet}
          className={cn(
            'w-full py-3 rounded-xl text-white font-bold text-lg transition-all',
            playing ? 'bg-gray-400 cursor-not-allowed' :
            !selectedBet ? 'bg-muted/50 cursor-not-allowed' :
            'bg-gradient-to-r from-brand-teal-dark to-brand-teal hover:opacity-90 active:scale-[0.98]'
          )}
        >
          {playing ? 'Playing...' : !selectedBet ? 'Select a bet option' : `Play ₹${amount.toLocaleString()}`}
        </button>
      </div>

      {/* Last Results */}
      {lastResults.length > 0 && (
        <div className="bg-card rounded-2xl shadow-sm border p-4 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Results</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {lastResults.map((r, i) => (
              <div key={i} className={cn(
                'flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-xs',
                r.isWinner ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
              )}>
                <span className="font-bold text-sm">{r.isWinner ? 'W' : 'L'}</span>
                <span className={cn('text-[10px]', r.isWinner ? 'text-green-600' : 'text-red-600')}>
                  {r.isWinner ? `+${r.win}` : `-${r.amount}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bet History Modal */}
      {showHistory && (
        <div className="bg-card rounded-2xl shadow-sm border p-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Bet History</h3>
          {betHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No history yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {betHistory.map((bet: any) => (
                <div key={bet.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-foreground">{bet.betType}</p>
                    <p className="text-[10px] text-muted-foreground">₹{Number(bet.amount)}</p>
                  </div>
                  <span className={cn('text-xs font-bold',
                    bet.status === 'WON' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {bet.status === 'WON' ? `+${formatCurrency(Number(bet.actualWin))}` : bet.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provably Fair Info */}
      <div className="bg-card rounded-2xl shadow-sm border p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1 mb-2">
          <Shield className="w-3 h-3" /> Provably Fair
        </h3>
        <p className="text-xs text-muted-foreground/70">
          Every round uses a cryptographically generated server seed (SHA-256 hashed and shown before play).
          After the game, the server seed is revealed so you can verify the result.
          The outcome is determined by HMAC-SHA256(serverSeed, clientSeed:nonce).
        </p>
      </div>
    </div>
  );
}

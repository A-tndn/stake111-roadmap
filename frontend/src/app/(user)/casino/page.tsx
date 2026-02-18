'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { casinoService } from '@/services/casino.service';
import { Gamepad2, Star, Zap } from 'lucide-react';

const gameIcons: Record<string, string> = {
  TEEN_PATTI: '🃏',
  INDIAN_POKER: '♠️',
  HI_LO: '📊',
  COIN_FLIP: '🪙',
  DICE_ROLL: '🎲',
  ROULETTE: '🎰',
  ANDAR_BAHAR: '🃏',
};

export default function CasinoPage() {
  const router = useRouter();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const res: any = await casinoService.getGames();
      const data = res?.data?.games || res?.data || res?.games || [];
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load games', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-brand-orange" />
          Casino
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Play instant games</p>
      </div>

      <div className="px-3 pb-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl border h-36 animate-pulse" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No games available yet</p>
            <p className="text-muted-foreground/70 text-xs mt-1">Casino games coming soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {games.map((game: any) => (
              <button
                key={game.id}
                onClick={() => router.push(`/casino/${game.id}`)}
                className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition group text-left"
              >
                <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark p-4 text-center">
                  <span className="text-4xl">{gameIcons[game.gameType] || '🎮'}</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-teal transition">
                    {game.gameName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {game.rtp && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Star className="w-3 h-3" /> RTP {Number(game.rtp)}%
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> Instant
                    </span>
                    {game.minBet && (
                      <span className="text-[10px] text-muted-foreground/70">Min ₹{Number(game.minBet)}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

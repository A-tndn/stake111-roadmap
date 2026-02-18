'use client';

import { useEffect, useState } from 'react';
import { casinoService } from '@/services/casino.service';
import { cn } from '@/lib/utils';
import {
  Gamepad2, Plus, ToggleLeft, ToggleRight, Save, X,
} from 'lucide-react';

const GAME_TYPES = ['COIN_FLIP', 'DICE_ROLL', 'HI_LO', 'TEEN_PATTI', 'INDIAN_POKER', 'BLACKJACK', 'ROULETTE', 'ANDAR_BAHAR'];
const GAME_ICONS: Record<string, string> = {
  TEEN_PATTI: '🃏', INDIAN_POKER: '♠️', HI_LO: '📊', COIN_FLIP: '🪙',
  DICE_ROLL: '🎲', BLACKJACK: '🃏', ROULETTE: '🎰', ANDAR_BAHAR: '🃏',
};

export default function AdminCasinoPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    gameName: '',
    gameType: 'COIN_FLIP',
    description: '',
    minBet: 100,
    maxBet: 50000,
    rtp: 96,
  });

  useEffect(() => { loadGames(); }, []);

  const loadGames = async () => {
    try {
      const res: any = await casinoService.getGames();
      const data = res?.data || [];
      setGames(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load games', err); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id: string) => {
    try {
      await casinoService.toggleGame(id);
      setMessage({ type: 'success', text: 'Game status updated' });
      loadGames();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to toggle' });
    }
  };

  const handleCreate = async () => {
    if (!form.gameName.trim()) {
      setMessage({ type: 'error', text: 'Game name is required' });
      return;
    }
    setCreating(true);
    try {
      await casinoService.createGame(form);
      setMessage({ type: 'success', text: 'Game created successfully' });
      setShowCreate(false);
      setForm({ gameName: '', gameType: 'COIN_FLIP', description: '', minBet: 100, maxBet: 50000, rtp: 96 });
      loadGames();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create game' });
    } finally { setCreating(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-brand-teal" /> Casino Management
        </h2>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
          {showCreate ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Game</>}
        </button>
      </div>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="bg-card rounded-xl border p-6 mb-4">
          <h3 className="font-semibold text-foreground text-sm mb-4">Create New Casino Game</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-1">Game Name *</label>
              <input type="text" value={form.gameName} onChange={(e) => setForm({ ...form, gameName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
                placeholder="e.g. Lucky Coin Flip" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-1">Game Type *</label>
              <select value={form.gameType} onChange={(e) => setForm({ ...form, gameType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-card focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none">
                {GAME_TYPES.map(t => <option key={t} value={t}>{GAME_ICONS[t]} {t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-foreground/80 mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
                placeholder="Short description of the game" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-1">Min Bet (₹)</label>
              <input type="number" min="1" value={form.minBet} onChange={(e) => setForm({ ...form, minBet: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-1">Max Bet (₹)</label>
              <input type="number" min="1" value={form.maxBet} onChange={(e) => setForm({ ...form, maxBet: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-1">RTP (%)</label>
              <input type="number" min="80" max="99.99" step="0.5" value={form.rtp}
                onChange={(e) => setForm({ ...form, rtp: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">House edge: {(100 - form.rtp).toFixed(1)}%</p>
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
            <Save className="w-4 h-4" /> {creating ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      )}

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-card rounded-xl border h-40 animate-pulse" />)
        ) : games.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
            No casino games created yet. Click &quot;Add Game&quot; to create one.
          </div>
        ) : (
          games.map((g: any) => (
            <div key={g.id} className={cn(
              'bg-card rounded-xl border p-4 transition',
              !g.enabled && 'opacity-60'
            )}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{GAME_ICONS[g.gameType] || '🎮'}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{g.gameName}</h3>
                    <p className="text-[10px] text-muted-foreground">{g.gameType.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={() => handleToggle(g.id)}
                  className={cn('p-1 rounded-lg transition',
                    g.enabled ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground/70 hover:bg-muted'
                  )}>
                  {g.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
              {g.description && <p className="text-xs text-muted-foreground mb-2">{g.description}</p>}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-lg p-1.5">
                  <p className="text-[10px] text-muted-foreground/70">Min Bet</p>
                  <p className="text-xs font-semibold">₹{Number(g.minBet)}</p>
                </div>
                <div className="bg-muted rounded-lg p-1.5">
                  <p className="text-[10px] text-muted-foreground/70">Max Bet</p>
                  <p className="text-xs font-semibold">₹{Number(g.maxBet)}</p>
                </div>
                <div className="bg-muted rounded-lg p-1.5">
                  <p className="text-[10px] text-muted-foreground/70">RTP</p>
                  <p className="text-xs font-semibold">{Number(g.rtp)}%</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium',
                  g.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                )}>
                  {g.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="text-[10px] text-muted-foreground/70">House Edge: {Number(g.houseEdge)}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

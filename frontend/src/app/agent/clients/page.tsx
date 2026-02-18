'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Users, Search, Lock, Unlock, ShieldOff, ShieldCheck } from 'lucide-react';

export default function ClientMasterPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadClients(); }, [statusFilter]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res: any = await adminService.getClients(params);
      const data = res?.data?.clients || res?.data || [];
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (id: string) => {
    try {
      await adminService.toggleClientLock(id);
      setMessage({ type: 'success', text: 'Account lock toggled' });
      loadClients();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const handleToggleBetLock = async (id: string) => {
    try {
      await adminService.toggleClientBetLock(id);
      setMessage({ type: 'success', text: 'Bet lock toggled' });
      loadClients();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const filtered = clients.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.username?.toLowerCase().includes(s) || c.displayName?.toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-teal" /> Client Master
        </h2>
      </div>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadClients()}
            placeholder="Search by username or name..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'ACTIVE', 'INACTIVE', 'SUSPENDED'].map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn('px-3 py-2 rounded-lg text-xs font-medium transition',
                statusFilter === f ? 'bg-brand-teal text-white' : 'bg-card text-muted-foreground border hover:bg-muted')}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No clients found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Client', 'Balance', 'Credit Limit', 'Status', 'Locks', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((client: any) => (
                  <tr key={client.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{client.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{client.username}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium">{formatCurrency(Number(client.balance || 0))}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatCurrency(Number(client.creditLimit || 0))}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                        client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        client.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700')}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggleLock(client.id)} title={client.userLocked ? 'Unlock account' : 'Lock account'}
                          className={cn('p-1 rounded transition', client.userLocked ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50')}>
                          {client.userLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleToggleBetLock(client.id)} title={client.betLocked ? 'Unlock bets' : 'Lock bets'}
                          className={cn('p-1 rounded transition', client.betLocked ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50')}>
                          {client.betLocked ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => router.push(`/agent/clients/${client.id}`)}
                        className="text-xs text-brand-teal hover:underline font-medium">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

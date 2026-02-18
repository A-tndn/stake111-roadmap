'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { masterService } from '@/services/master.service';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Users, Eye, Lock, Unlock, Search, Plus,
  Shield, Crown,
} from 'lucide-react';

export default function AdminsListPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadAdmins(); }, []);

  const loadAdmins = async () => {
    try {
      const res: any = await masterService.getAdmins({ limit: 100 });
      const data = res?.data?.agents || res?.data || [];
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load admins', err); }
    finally { setLoading(false); }
  };

  const handleToggleLock = async (id: string) => {
    try {
      await masterService.toggleAdminLock(id);
      setMessage({ type: 'success', text: 'Lock status updated' });
      loadAdmins();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to toggle lock' });
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    SUPER_MASTER: <Crown className="w-3 h-3" />,
    MASTER: <Shield className="w-3 h-3" />,
    AGENT: <Users className="w-3 h-3" />,
  };

  const typeColors: Record<string, string> = {
    SUPER_MASTER: 'bg-yellow-100 text-yellow-800',
    MASTER: 'bg-blue-100 text-blue-800',
    AGENT: 'bg-green-100 text-green-800',
  };

  const filtered = admins.filter((a: any) => {
    const matchesSearch = !search ||
      a.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      a.username?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || a.agentType === filterType;
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-gold" /> All Admins & Agents
        </h2>
        <button
          onClick={() => router.push('/master/admins/create')}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Create Admin
        </button>
      </div>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-card">
          <option value="ALL">All Types</option>
          <option value="SUPER_MASTER">Super Master</option>
          <option value="MASTER">Master</option>
          <option value="AGENT">Agent</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-card">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No admins found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Admin', 'Type', 'Balance', 'Credit Limit', 'Commission', 'Players', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((admin: any) => (
                  <tr key={admin.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{admin.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{admin.username}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1',
                        typeColors[admin.agentType] || 'bg-muted text-foreground'
                      )}>
                        {typeIcons[admin.agentType]}
                        {admin.agentType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium">{formatCurrency(Number(admin.balance || 0))}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatCurrency(Number(admin.creditLimit || 0))}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{admin.commissionRate || 0}%</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{admin._count?.players || admin.playersCount || 0}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                        admin.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => router.push(`/master/admins/${admin.id}`)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggleLock(admin.id)}
                          className={cn('p-1.5 rounded-lg transition', admin.status === 'ACTIVE'
                            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                          )} title={admin.status === 'ACTIVE' ? 'Lock' : 'Unlock'}>
                          {admin.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
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

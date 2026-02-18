'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { masterService } from '@/services/master.service';
import { ArrowLeft, Shield, UserPlus } from 'lucide-react';

const ALL_PERMISSIONS = [
  'CAN_CREATE_CLIENTS', 'CAN_MANAGE_DEPOSITS', 'CAN_MANAGE_WITHDRAWALS',
  'CAN_VIEW_REPORTS', 'CAN_MANAGE_MATCHES', 'CAN_SETTLE_BETS',
  'CAN_ACCESS_CASINO', 'CAN_CREATE_SUB_AGENTS', 'CAN_MANAGE_ODDS', 'CAN_VIEW_AUDIT_LOGS',
];

export default function CreateAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState<any[]>([]);

  const [form, setForm] = useState({
    username: '',
    password: '',
    displayName: '',
    phone: '',
    email: '',
    agentType: 'AGENT' as 'SUPER_MASTER' | 'MASTER' | 'AGENT',
    parentAgentId: '',
    commissionRate: 5,
    creditLimit: 0,
    maxPlayersAllowed: 50,
    sportSharePercent: 0,
    permissions: [] as string[],
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const res: any = await masterService.getAdmins({ limit: 200 });
      const data = res?.data?.agents || res?.data || [];
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load agents', err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data: any = {
        username: form.username,
        password: form.password,
        displayName: form.displayName,
        phone: form.phone,
        agentType: form.agentType,
        commissionRate: form.commissionRate,
        creditLimit: form.creditLimit,
        maxPlayersAllowed: form.maxPlayersAllowed,
        sportSharePercent: form.sportSharePercent,
        permissions: form.permissions,
      };
      if (form.email) data.email = form.email;
      if (form.parentAgentId) data.parentAgentId = form.parentAgentId;

      await masterService.createAdmin(data);
      router.push('/master/admins');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create admin');
    } finally { setLoading(false); }
  };

  const togglePermission = (perm: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const selectAllPermissions = () => {
    setForm(prev => ({ ...prev, permissions: [...ALL_PERMISSIONS] }));
  };

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <UserPlus className="w-5 h-5 text-brand-gold" /> Create Admin / Agent
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Username *</label>
              <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                placeholder="e.g. agent_mumbai" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Password *</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Display Name *</label>
              <input type="text" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                placeholder="e.g. Mumbai Admin" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phone *</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                placeholder="+91XXXXXXXXXX" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                placeholder="optional" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Agent Type *</label>
              <select value={form.agentType} onChange={(e) => setForm({ ...form, agentType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-card focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none">
                <option value="SUPER_MASTER">Super Master</option>
                <option value="MASTER">Master</option>
                <option value="AGENT">Agent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hierarchy */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-semibold text-foreground text-sm mb-4">Hierarchy & Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Parent Agent</label>
              <select value={form.parentAgentId} onChange={(e) => setForm({ ...form, parentAgentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-card focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none">
                <option value="">None (Top Level)</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.displayName} ({a.agentType})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Commission Rate (%)</label>
              <input type="number" min="0" max="50" step="0.5" value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Credit Limit</label>
              <input type="number" min="0" value={form.creditLimit}
                onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Max Players Allowed</label>
              <input type="number" min="1" value={form.maxPlayersAllowed}
                onChange={(e) => setForm({ ...form, maxPlayersAllowed: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Sport Share %</label>
              <input type="number" min="0" max="100" step="1" value={form.sportSharePercent}
                onChange={(e) => setForm({ ...form, sportSharePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-gold" /> Permissions
            </h3>
            <button type="button" onClick={selectAllPermissions} className="text-xs text-brand-gold hover:underline">
              Select All
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(perm)}
                  onChange={() => togglePermission(perm)}
                  className="w-4 h-4 rounded border-border text-brand-gold focus:ring-brand-gold"
                />
                <span className="text-xs text-foreground">{perm.replace(/CAN_/g, '').replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 border rounded-lg text-sm text-foreground hover:bg-muted transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { masterService } from '@/services/master.service';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import StatsCard from '@/components/admin/StatsCard';
import {
  ArrowLeft, Shield, Users, DollarSign, TrendingUp,
  Lock, Unlock, Key, Save, Crown,
} from 'lucide-react';

const ALL_PERMISSIONS = [
  'CAN_CREATE_CLIENTS', 'CAN_MANAGE_DEPOSITS', 'CAN_MANAGE_WITHDRAWALS',
  'CAN_VIEW_REPORTS', 'CAN_MANAGE_MATCHES', 'CAN_SETTLE_BETS',
  'CAN_ACCESS_CASINO', 'CAN_CREATE_SUB_AGENTS', 'CAN_MANAGE_ODDS', 'CAN_VIEW_AUDIT_LOGS',
];

export default function AdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;
  const [admin, setAdmin] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [resetPwd, setResetPwd] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadAdmin(); }, [adminId]);

  const loadAdmin = async () => {
    try {
      const [adminRes, clientsRes] = await Promise.all([
        masterService.getAdminById(adminId),
        masterService.getAdminClients(adminId, { limit: 50 }),
      ]);
      const adminData = (adminRes as any)?.data;
      setAdmin(adminData);
      setPermissions(adminData?.permissions || []);
      const clientsData = (clientsRes as any)?.data?.players || (clientsRes as any)?.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) { console.error('Failed to load admin', err); }
    finally { setLoading(false); }
  };

  const handleToggleLock = async () => {
    try {
      await masterService.toggleAdminLock(adminId);
      setMessage({ type: 'success', text: 'Lock status updated' });
      loadAdmin();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      await masterService.updateAdminPermissions(adminId, permissions);
      setMessage({ type: 'success', text: 'Permissions updated' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update permissions' });
    } finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!resetPwd || resetPwd.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    try {
      await masterService.resetAdminPassword(adminId, { newPassword: resetPwd });
      setMessage({ type: 'success', text: 'Password reset successfully' });
      setResetPwd('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset password' });
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading admin details...</div>;
  }

  if (!admin) {
    return <div className="p-8 text-center text-muted-foreground">Admin not found</div>;
  }

  const typeColor = admin.agentType === 'SUPER_MASTER' ? 'text-yellow-700 bg-yellow-100'
    : admin.agentType === 'MASTER' ? 'text-blue-700 bg-blue-100' : 'text-green-700 bg-green-100';

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {admin.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{admin.displayName}</h2>
                <p className="text-sm text-muted-foreground">@{admin.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', typeColor)}>
                {admin.agentType?.replace('_', ' ')}
              </span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                admin.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {admin.status}
              </span>
              {admin.level !== undefined && (
                <span className="text-xs text-muted-foreground">Level {admin.level}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleLock}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition',
              admin.status === 'ACTIVE' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
            )}
          >
            {admin.status === 'ACTIVE' ? <><Lock className="w-4 h-4" /> Lock Account</> : <><Unlock className="w-4 h-4" /> Unlock Account</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatsCard title="Balance" value={formatCurrency(Number(admin.balance || 0))} icon={DollarSign} color="green" />
        <StatsCard title="Credit Limit" value={formatCurrency(Number(admin.creditLimit || 0))} icon={TrendingUp} color="blue" />
        <StatsCard title="Commission Rate" value={`${admin.commissionRate || 0}%`} icon={Crown} color="orange" />
        <StatsCard title="Players" value={clients.length} icon={Users} color="purple" />
      </div>

      {/* Permissions */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-gold" /> Permissions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {ALL_PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted">
              <input
                type="checkbox"
                checked={permissions.includes(perm)}
                onChange={() => togglePermission(perm)}
                className="w-4 h-4 rounded border-border text-brand-gold focus:ring-brand-gold"
              />
              <span className="text-xs text-foreground">{perm.replace(/CAN_/g, '').replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleSavePermissions}
          disabled={saving}
          className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>

      {/* Reset Password */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-gold" /> Reset Password
        </h3>
        <div className="flex gap-3">
          <input
            type="password"
            placeholder="New password (min 6 chars)"
            value={resetPwd}
            onChange={(e) => setResetPwd(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
          />
          <button
            onClick={handleResetPassword}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            Reset Password
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-foreground text-sm">Players ({clients.length})</h3>
        </div>
        {clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No players under this admin</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Player', 'Balance', 'Credit Limit', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{c.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{c.username}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium">{formatCurrency(Number(c.balance || 0))}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatCurrency(Number(c.creditLimit || 0))}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                        c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {c.status}
                      </span>
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

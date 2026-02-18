'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowLeft, User, Wallet, Lock, Unlock, ShieldCheck, ShieldOff, Save } from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const [client, setClient] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editForm, setEditForm] = useState({ creditLimit: '', minBet: '', maxBet: '', matchLimit: '', sessionLimit: '' });

  useEffect(() => { loadClient(); }, [clientId]);

  const loadClient = async () => {
    try {
      const [clientRes, reportRes] = await Promise.all([
        adminService.getClientById(clientId),
        adminService.getClientReport(clientId).catch(() => null),
      ]);
      const c = (clientRes as any).data || clientRes;
      setClient(c);
      setReport((reportRes as any)?.data || reportRes);
      setEditForm({
        creditLimit: c.creditLimit?.toString() || '',
        minBet: c.minBet?.toString() || '',
        maxBet: c.maxBet?.toString() || '',
        matchLimit: c.matchLimit?.toString() || '',
        sessionLimit: c.sessionLimit?.toString() || '',
      });
    } catch (err) {
      console.error('Failed to load client', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const data: any = {};
      if (editForm.creditLimit) data.creditLimit = parseFloat(editForm.creditLimit);
      if (editForm.minBet) data.minBet = parseFloat(editForm.minBet);
      if (editForm.maxBet) data.maxBet = parseFloat(editForm.maxBet);
      if (editForm.matchLimit) data.matchLimit = parseFloat(editForm.matchLimit);
      if (editForm.sessionLimit) data.sessionLimit = parseFloat(editForm.sessionLimit);
      await adminService.updateClient(clientId, data);
      setMessage({ type: 'success', text: 'Client updated' });
      loadClient();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async () => {
    try { await adminService.toggleClientLock(clientId); loadClient(); } catch (err) { /* */ }
  };

  const handleToggleBetLock = async () => {
    try { await adminService.toggleClientBetLock(clientId); loadClient(); } catch (err) { /* */ }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>;
  if (!client) return <div className="text-center py-12 text-muted-foreground text-sm">Client not found</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Client header */}
      <div className="bg-card rounded-xl border p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-teal rounded-full flex items-center justify-center text-white text-lg font-bold">
              {(client.displayName || client.username)[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{client.displayName}</h2>
              <p className="text-sm text-muted-foreground">@{client.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleToggleLock}
              className={cn('flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                client.userLocked ? 'text-red-600 border-red-200 bg-red-50' : 'text-green-600 border-green-200 bg-green-50')}>
              {client.userLocked ? <><Lock className="w-3.5 h-3.5" /> Locked</> : <><Unlock className="w-3.5 h-3.5" /> Active</>}
            </button>
            <button onClick={handleToggleBetLock}
              className={cn('flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                client.betLocked ? 'text-red-600 border-red-200 bg-red-50' : 'text-green-600 border-green-200 bg-green-50')}>
              {client.betLocked ? <><ShieldOff className="w-3.5 h-3.5" /> Bet Locked</> : <><ShieldCheck className="w-3.5 h-3.5" /> Bet Open</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="text-lg font-bold text-brand-teal">{formatCurrency(Number(client.balance || 0))}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Credit Limit</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(Number(client.creditLimit || 0))}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Total Bets</p>
          <p className="text-lg font-bold text-blue-600">{report?.totalBets || 0}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Net P&L</p>
          <p className={cn('text-lg font-bold', (report?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatCurrency(report?.profitLoss || 0)}
          </p>
        </div>
      </div>

      {/* Edit limits */}
      <div className="bg-card rounded-xl border p-5 mb-4">
        <h3 className="font-semibold text-foreground text-sm mb-3">Edit Limits</h3>
        {message.text && (
          <div className={cn('mb-3 p-2 rounded text-xs', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
            {message.text}
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Credit Limit', key: 'creditLimit' },
            { label: 'Min Bet', key: 'minBet' },
            { label: 'Max Bet', key: 'maxBet' },
            { label: 'Match Limit', key: 'matchLimit' },
            { label: 'Session Limit', key: 'sessionLimit' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs text-muted-foreground mb-1">{label}</label>
              <input type="number" value={(editForm as any)[key]}
                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none" />
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-3 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

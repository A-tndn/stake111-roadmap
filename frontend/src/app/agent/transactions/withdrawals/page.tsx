'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowUpCircle, CheckCircle, XCircle } from 'lucide-react';

export default function WithdrawalsApprovalPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadWithdrawals(); }, []);

  const loadWithdrawals = async () => {
    try {
      const res: any = await adminService.getPendingWithdrawals({ limit: 50 });
      const data = res?.data?.withdrawals || res?.data || [];
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load withdrawals', err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveWithdrawal(id);
      setMessage({ type: 'success', text: 'Withdrawal approved' });
      loadWithdrawals();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve' });
    }
  };

  const handleReject = async (id: string) => {
    const remarks = prompt('Rejection reason (optional):');
    try {
      await adminService.rejectWithdrawal(id, remarks || undefined);
      setMessage({ type: 'success', text: 'Withdrawal rejected' });
      loadWithdrawals();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject' });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <ArrowUpCircle className="w-5 h-5 text-brand-orange" /> Pending Withdrawals
      </h2>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="bg-card rounded-xl border h-40 animate-pulse" />
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border text-muted-foreground text-sm">No pending withdrawals</div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['User', 'Amount', 'Method', 'Account', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{w.user?.displayName || w.userId}</p>
                      <p className="text-xs text-muted-foreground">@{w.user?.username}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-red-600">{formatCurrency(Number(w.amount))}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{w.paymentMethod}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{w.accountDetails || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(w.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleApprove(w.id)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(w.id)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

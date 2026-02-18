'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowDownCircle, CheckCircle, XCircle } from 'lucide-react';

export default function MasterDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadDeposits(); }, []);

  const loadDeposits = async () => {
    try {
      const res: any = await adminService.getPendingDeposits({ limit: 100 });
      const data = res?.data?.deposits || res?.data || [];
      setDeposits(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load deposits', err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveDeposit(id);
      setMessage({ type: 'success', text: 'Deposit approved' });
      loadDeposits();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const handleReject = async (id: string) => {
    const remarks = prompt('Rejection reason (optional):');
    try {
      await adminService.rejectDeposit(id, remarks || undefined);
      setMessage({ type: 'success', text: 'Deposit rejected' });
      loadDeposits();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <ArrowDownCircle className="w-5 h-5 text-brand-gold" /> All Pending Deposits
      </h2>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : deposits.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No pending deposits</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['User', 'Agent', 'Amount', 'Method', 'Remarks', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {deposits.map((d: any) => (
                  <tr key={d.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{d.user?.displayName || d.userId}</p>
                      <p className="text-xs text-muted-foreground">@{d.user?.username}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{d.user?.agent?.displayName || '-'}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-green-600">{formatCurrency(Number(d.amount))}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{d.paymentMethod}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{d.remarks || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleApprove(d.id)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(d.id)}
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
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { withdrawalService } from '@/services/withdrawal.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowUpCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

const PAYMENT_METHODS = ['UPI', 'BANK_TRANSFER', 'CASH', 'OTHER'];

export default function WithdrawPage() {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [accountDetails, setAccountDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const res: any = await withdrawalService.getMyWithdrawals({ limit: 20 });
      const data = res?.data?.withdrawals || res?.data || [];
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load withdrawals', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount' });
      return;
    }
    if (user?.balance !== undefined && amountNum > user.balance) {
      setMessage({ type: 'error', text: 'Amount exceeds available balance' });
      return;
    }

    setSubmitting(true);
    try {
      await withdrawalService.createRequest({ amount: amountNum, paymentMethod: method, accountDetails, remarks });
      setMessage({ type: 'success', text: 'Withdrawal request submitted!' });
      setAmount('');
      setAccountDetails('');
      setRemarks('');
      loadWithdrawals();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ArrowUpCircle className="w-5 h-5 text-brand-orange" />
          Withdraw
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Available: <strong className="text-brand-teal">{formatCurrency(user?.balance || 0)}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-3 mb-4">
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Payment Method</label>
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                    method === m ? 'bg-brand-teal text-white border-brand-teal' : 'bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Account Details</label>
            <input
              type="text"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder="UPI ID, bank account, etc."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Remarks (optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal outline-none"
            />
          </div>

          {message.text && (
            <p className={cn('text-sm', message.type === 'error' ? 'text-red-600' : 'text-green-600')}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-orange text-white py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
          </button>
        </div>
      </form>

      {/* History */}
      <div className="px-3 pb-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">Withdrawal History</h2>
        <div className="space-y-1.5">
          {withdrawals.map((w: any) => (
            <div key={w.id} className="bg-card rounded-lg border px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {w.status === 'APPROVED' ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                 w.status === 'REJECTED' ? <XCircle className="w-4 h-4 text-red-500" /> :
                 <Clock className="w-4 h-4 text-yellow-500" />}
                <div>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(parseFloat(w.amount))}</p>
                  <p className="text-[10px] text-muted-foreground/70">{w.paymentMethod} - {formatDate(w.createdAt)}</p>
                </div>
              </div>
              <span className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                w.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                w.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {w.status}
              </span>
            </div>
          ))}
          {withdrawals.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">No withdrawals yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

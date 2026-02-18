'use client';

import { useState, useEffect } from 'react';
import { depositService } from '@/services/deposit.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowDownCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

const PAYMENT_METHODS = ['UPI', 'BANK_TRANSFER', 'CASH', 'OTHER'];

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    try {
      const res: any = await depositService.getMyDeposits({ limit: 20 });
      const data = res?.data?.deposits || res?.data || [];
      setDeposits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load deposits', err);
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

    setSubmitting(true);
    try {
      await depositService.createRequest({ amount: amountNum, paymentMethod: method, remarks });
      setMessage({ type: 'success', text: 'Deposit request submitted!' });
      setAmount('');
      setRemarks('');
      loadDeposits();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'APPROVED') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ArrowDownCircle className="w-5 h-5 text-brand-green" />
          Deposit
        </h1>
      </div>

      {/* Form */}
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
            <label className="text-sm text-muted-foreground mb-1 block">Remarks (optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Transaction ID, reference, etc."
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
            className="w-full bg-brand-green text-white py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Deposit Request'}
          </button>
        </div>
      </form>

      {/* History */}
      <div className="px-3 pb-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">Deposit History</h2>
        <div className="space-y-1.5">
          {deposits.map((d: any) => (
            <div key={d.id} className="bg-card rounded-lg border px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {statusIcon(d.status)}
                <div>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(parseFloat(d.amount))}</p>
                  <p className="text-[10px] text-muted-foreground/70">{d.paymentMethod} - {formatDate(d.createdAt)}</p>
                </div>
              </div>
              <span className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                d.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                d.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {d.status}
              </span>
            </div>
          ))}
          {deposits.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">No deposits yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

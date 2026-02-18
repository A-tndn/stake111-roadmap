'use client';

import { useEffect, useState } from 'react';
import { masterService } from '@/services/master.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Landmark, CheckCircle, XCircle, DollarSign, Calendar } from 'lucide-react';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ periodStart: '', periodEnd: '' });
  const [showGenerate, setShowGenerate] = useState(false);
  const [payModal, setPayModal] = useState<any>(null);
  const [payForm, setPayForm] = useState({ paymentMethod: '', paymentTransactionId: '', remarks: '' });

  useEffect(() => { loadSettlements(); }, []);

  const loadSettlements = async () => {
    try {
      const res: any = await masterService.getSettlements({ limit: 100 });
      const data = res?.data?.settlements || res?.data || [];
      setSettlements(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load settlements', err); }
    finally { setLoading(false); }
  };

  const handleGenerateAll = async () => {
    if (!genForm.periodStart || !genForm.periodEnd) return;
    setGenerating(true);
    try {
      await masterService.generateAllSettlements(genForm);
      setMessage({ type: 'success', text: 'Settlements generated for all agents' });
      setShowGenerate(false);
      loadSettlements();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate' });
    } finally { setGenerating(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await masterService.approveSettlement(id);
      setMessage({ type: 'success', text: 'Settlement approved' });
      loadSettlements();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve' });
    }
  };

  const handlePay = async () => {
    if (!payModal || !payForm.paymentMethod) return;
    try {
      await masterService.paySettlement(payModal.id, payForm);
      setMessage({ type: 'success', text: 'Settlement marked as paid' });
      setPayModal(null);
      setPayForm({ paymentMethod: '', paymentTransactionId: '', remarks: '' });
      loadSettlements();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to pay' });
    }
  };

  const handleReject = async (id: string) => {
    const remarks = prompt('Rejection reason:');
    if (remarks === null) return;
    try {
      await masterService.rejectSettlement(id, remarks);
      setMessage({ type: 'success', text: 'Settlement rejected' });
      loadSettlements();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject' });
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    ON_HOLD: 'bg-muted text-foreground',
  };

  const filtered = filterStatus === 'ALL' ? settlements : settlements.filter((s: any) => s.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Landmark className="w-5 h-5 text-brand-gold" /> Settlements
        </h2>
        <button onClick={() => setShowGenerate(!showGenerate)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
          <Calendar className="w-4 h-4" /> Generate Settlements
        </button>
      </div>

      {message.text && (
        <div className={cn('mb-3 p-3 rounded-lg text-sm', message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message.text}
        </div>
      )}

      {/* Generate Form */}
      {showGenerate && (
        <div className="bg-card rounded-xl border p-4 mb-4">
          <h3 className="font-semibold text-sm text-foreground mb-3">Generate for All Agents</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Period Start</label>
              <input type="date" value={genForm.periodStart} onChange={(e) => setGenForm({ ...genForm, periodStart: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Period End</label>
              <input type="date" value={genForm.periodEnd} onChange={(e) => setGenForm({ ...genForm, periodEnd: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button onClick={handleGenerateAll} disabled={generating}
              className="px-4 py-2 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-card rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-4">Mark as Paid</h3>
            <p className="text-sm text-muted-foreground mb-4">Settlement for {payModal.agent?.displayName} — {formatCurrency(Number(payModal.settlementAmount || 0))}</p>
            <div className="space-y-3">
              <input type="text" placeholder="Payment Method (e.g. UPI, Bank)" value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Transaction ID (optional)" value={payForm.paymentTransactionId}
                onChange={(e) => setPayForm({ ...payForm, paymentTransactionId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Remarks (optional)" value={payForm.remarks}
                onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPayModal(null)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handlePay} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
              filterStatus === status ? 'bg-brand-gold text-white' : 'bg-card border text-muted-foreground hover:bg-muted'
            )}>
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No settlements found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Agent', 'Period', 'Bets', 'Net Profit', 'Commission', 'Settlement Amt', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{s.agent?.displayName || s.agentId}</p>
                      <p className="text-xs text-muted-foreground">{s.agent?.agentType?.replace('_', ' ')}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {formatDate(s.periodStart)} - {formatDate(s.periodEnd)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{s.totalBetsPlaced || 0}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-sm font-medium', Number(s.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {formatCurrency(Number(s.netProfit || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
                      {formatCurrency(Number(s.commissionAmount || 0))}
                      <span className="text-xs text-muted-foreground ml-1">({s.commissionRate || 0}%)</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold">{formatCurrency(Number(s.settlementAmount || 0))}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[s.status] || 'bg-muted text-foreground')}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {s.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(s.id)}
                              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition" title="Approve">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleReject(s.id)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Reject">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {s.status === 'APPROVED' && (
                          <button onClick={() => setPayModal(s)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="Mark as Paid">
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}
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

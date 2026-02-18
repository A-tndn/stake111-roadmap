'use client';

import { useEffect, useState } from 'react';
import { masterService } from '@/services/master.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { BookOpen, Search } from 'lucide-react';

export default function AllTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => { loadTransactions(); }, []);

  const loadTransactions = async () => {
    try {
      const res: any = await masterService.getAllTransactions({ limit: 100 });
      const data = res?.data?.transactions || res?.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load transactions', err); }
    finally { setLoading(false); }
  };

  const typeColors: Record<string, string> = {
    DEPOSIT: 'bg-green-100 text-green-700',
    WITHDRAWAL: 'bg-red-100 text-red-700',
    BET_PLACED: 'bg-blue-100 text-blue-700',
    BET_WON: 'bg-green-100 text-green-700',
    BET_LOST: 'bg-red-100 text-red-700',
    CREDIT: 'bg-purple-100 text-purple-700',
    DEBIT: 'bg-orange-100 text-orange-700',
    COMMISSION: 'bg-yellow-100 text-yellow-700',
    REFUND: 'bg-muted text-foreground',
  };

  const filtered = transactions.filter((t: any) => {
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesSearch = !search ||
      t.user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      t.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-brand-gold" /> All Transactions
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by user or description..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-card">
          <option value="ALL">All Types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="BET_PLACED">Bet Placed</option>
          <option value="BET_WON">Bet Won</option>
          <option value="BET_LOST">Bet Lost</option>
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
          <option value="COMMISSION">Commission</option>
        </select>
      </div>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['User', 'Type', 'Amount', 'Balance After', 'Description', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t: any, idx: number) => (
                  <tr key={t.id || idx} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{t.user?.displayName || t.userId}</p>
                      <p className="text-xs text-muted-foreground">@{t.user?.username}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', typeColors[t.type] || 'bg-muted text-foreground')}>
                        {t.type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-sm font-medium',
                        ['DEPOSIT', 'BET_WON', 'CREDIT', 'REFUND'].includes(t.type) ? 'text-green-600' : 'text-red-600'
                      )}>
                        {['DEPOSIT', 'BET_WON', 'CREDIT', 'REFUND'].includes(t.type) ? '+' : '-'}
                        {formatCurrency(Math.abs(Number(t.amount || 0)))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
                      {t.balanceAfter ? formatCurrency(Number(t.balanceAfter)) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                      {t.description || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(t.createdAt)}</td>
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

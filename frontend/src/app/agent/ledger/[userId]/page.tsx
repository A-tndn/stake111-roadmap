'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function UserLedgerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLedger(); }, [userId]);

  const loadLedger = async () => {
    try {
      const res: any = await adminService.getUserLedger(userId, { limit: 100 });
      const data = res?.data?.transactions || res?.data?.bets || res?.data || [];
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load ledger', err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Ledger
      </button>

      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-brand-teal" /> Client Ledger Detail
      </h2>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No ledger entries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Date', 'Type', 'Description', 'Amount', 'Balance'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry: any, idx: number) => (
                  <tr key={entry.id || idx} className="hover:bg-muted">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(entry.createdAt || entry.settledAt)}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-foreground/80">{entry.type || entry.betType || entry.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                      {entry.description || entry.betOn || '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-sm font-medium',
                        (entry.type === 'BET_WON' || entry.type === 'DEPOSIT' || entry.type === 'CREDIT') ? 'text-green-600' : 'text-red-600')}>
                        {formatCurrency(Number(entry.amount || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium">{entry.balanceAfter ? formatCurrency(Number(entry.balanceAfter)) : '-'}</td>
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agentService } from '@/services/agent.service';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { BookOpen, Eye } from 'lucide-react';

export default function AgentLedgerPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPlayers(); }, []);

  const loadPlayers = async () => {
    try {
      const res = await agentService.getPlayers();
      setPlayers((res as any).data || []);
    } catch (err) { console.error('Failed to load players', err); }
    finally { setLoading(false); }
  };

  const totalBalance = players.reduce((sum, p: any) => sum + Number(p.balance || 0), 0);
  const totalCredit = players.reduce((sum, p: any) => sum + Number(p.creditLimit || 0), 0);
  const totalExposure = totalCredit - totalBalance;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-brand-teal" /> Ledger
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Total Balance</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Total Credit</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(totalCredit)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Net Exposure</p>
          <p className={cn('text-lg font-bold', totalExposure > 0 ? 'text-red-600' : 'text-green-600')}>
            {formatCurrency(Math.abs(totalExposure))}
          </p>
        </div>
      </div>

      {/* Player ledger */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold text-foreground text-sm">Client Ledger</h3></div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No clients</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['Client', 'Balance', 'Credit Limit', 'Exposure', 'P&L', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {players.map((p: any) => {
                  const balance = Number(p.balance || 0);
                  const credit = Number(p.creditLimit || 0);
                  const exposure = credit - balance;
                  return (
                    <tr key={p.id} className="hover:bg-muted">
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-medium text-foreground">{p.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{p.username}</p>
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium">{formatCurrency(balance)}</td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatCurrency(credit)}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('text-sm font-medium', exposure > 0 ? 'text-red-600' : 'text-green-600')}>
                          {exposure > 0 ? '-' : '+'}{formatCurrency(Math.abs(exposure))}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn('text-sm font-medium', balance > credit ? 'text-green-600' : 'text-red-600')}>
                          {formatCurrency(balance - credit)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => router.push(`/agent/ledger/${p.id}`)}
                          className="text-xs text-brand-teal hover:underline flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

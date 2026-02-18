'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agentService } from '@/services/agent.service';
import { formatCurrency } from '@/lib/utils';
import StatsCard from '@/components/admin/StatsCard';
import { Users, Wallet, TrendingUp, Clock } from 'lucide-react';

export default function AgentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, playersRes] = await Promise.all([
        agentService.getStats(),
        agentService.getPlayers(),
      ]);
      setStats((statsRes as any).data);
      setPlayers((playersRes as any).data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatsCard title="Balance" value={formatCurrency(stats?.balance || 0)} icon={Wallet} color="green" />
        <StatsCard title="Total Players" value={stats?.stats?.totalPlayers || 0} icon={Users} color="blue" />
        <StatsCard title="Total Commission" value={formatCurrency(stats?.totalCommissions || 0)} icon={TrendingUp} color="purple" />
        <StatsCard title="Pending Settlement" value={formatCurrency(stats?.unpaidCommissions || 0)} icon={Clock} color="orange" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => router.push('/agent/players')}
          className="bg-card rounded-xl p-4 shadow-sm border hover:shadow-md transition text-left"
        >
          <h3 className="font-semibold text-foreground text-sm">Manage Players</h3>
          <p className="text-xs text-muted-foreground mt-1">Create and manage player accounts</p>
        </button>
        <button
          onClick={() => router.push('/agent/credits')}
          className="bg-card rounded-xl p-4 shadow-sm border hover:shadow-md transition text-left"
        >
          <h3 className="font-semibold text-foreground text-sm">Credit Management</h3>
          <p className="text-xs text-muted-foreground mt-1">Transfer or deduct credits</p>
        </button>
        <button
          onClick={() => router.push('/agent/matches/current')}
          className="bg-card rounded-xl p-4 shadow-sm border hover:shadow-md transition text-left"
        >
          <h3 className="font-semibold text-foreground text-sm">Match Management</h3>
          <p className="text-xs text-muted-foreground mt-1">Manage odds and settle matches</p>
        </button>
      </div>

      {/* Players Table */}
      <div className="bg-card rounded-xl shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Your Players</h3>
          <button onClick={() => router.push('/agent/players')} className="text-xs text-brand-teal hover:underline">
            View All
          </button>
        </div>
        {players.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No players yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Player</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase">Balance</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase">Credit Limit</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {players.slice(0, 10).map((player: any) => (
                  <tr key={player.id} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{player.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{player.username}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">{formatCurrency(Number(player.balance))}</td>
                    <td className="px-4 py-2.5 text-sm text-right text-muted-foreground">{formatCurrency(Number(player.creditLimit))}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        player.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {player.status}
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

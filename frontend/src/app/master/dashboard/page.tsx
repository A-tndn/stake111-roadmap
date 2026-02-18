'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { masterService } from '@/services/master.service';
import { formatCurrency } from '@/lib/utils';
import StatsCard from '@/components/admin/StatsCard';
import {
  LayoutDashboard, Users, Trophy, DollarSign, TrendingUp,
  Activity, Landmark, Shield,
} from 'lucide-react';

export default function MasterDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res: any = await masterService.getDashboardStats();
      setStats(res?.data || {});
    } catch (err) { console.error('Failed to load dashboard stats', err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <LayoutDashboard className="w-5 h-5 text-brand-gold" /> Master Dashboard
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="bg-card rounded-xl border h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Platform Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="blue" subtitle={`${stats?.activeUsers || 0} active`} />
            <StatsCard title="Total Agents" value={stats?.totalAgents || 0} icon={Shield} color="purple" subtitle={`${stats?.activeAgents || 0} active`} />
            <StatsCard title="Platform Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={DollarSign} color="green" />
            <StatsCard title="Total Matches" value={stats?.totalMatches || 0} icon={Trophy} color="orange" subtitle={`${stats?.liveMatches || 0} live`} />
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatsCard title="Total Bets Placed" value={stats?.totalBets || 0} icon={Activity} color="teal" />
            <StatsCard title="Total Bet Volume" value={formatCurrency(stats?.totalBetVolume || 0)} icon={TrendingUp} color="blue" />
            <StatsCard title="Platform P&L" value={formatCurrency(stats?.platformPnL || 0)} icon={DollarSign} color={stats?.platformPnL >= 0 ? 'green' : 'red'} />
            <StatsCard title="Pending Settlements" value={formatCurrency(stats?.pendingSettlements || 0)} icon={Landmark} color="orange" />
          </div>

          {/* Quick Actions */}
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Manage Admins', href: '/master/admins', icon: Users, color: 'bg-blue-50 text-blue-600' },
              { label: 'View Hierarchy', href: '/master/admins/hierarchy', icon: Shield, color: 'bg-purple-50 text-purple-600' },
              { label: 'Settlements', href: '/master/settlements', icon: Landmark, color: 'bg-orange-50 text-orange-600' },
              { label: 'Platform Settings', href: '/master/settings', icon: Activity, color: 'bg-green-50 text-green-600' },
              { label: 'All Matches', href: '/master/matches', icon: Trophy, color: 'bg-teal-50 text-teal-700' },
              { label: 'Transactions', href: '/master/transactions', icon: DollarSign, color: 'bg-yellow-50 text-yellow-700' },
              { label: 'Reports', href: '/master/reports', icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Audit Logs', href: '/master/audit-logs', icon: Shield, color: 'bg-red-50 text-red-600' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="bg-card rounded-xl border p-4 hover:shadow-md transition text-left group"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-foreground group-hover:text-brand-gold transition">{action.label}</p>
              </button>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-foreground text-sm mb-4">Platform Status</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Deposits</span>
                <span className="font-medium">{stats?.pendingDeposits || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Withdrawals</span>
                <span className="font-medium">{stats?.pendingWithdrawals || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unsettled Matches</span>
                <span className="font-medium">{stats?.unsettledMatches || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Commissions</span>
                <span className="font-medium">{formatCurrency(stats?.totalCommissions || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Sessions</span>
                <span className="font-medium">{stats?.activeSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maintenance Mode</span>
                <span className={`font-medium ${stats?.maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
                  {stats?.maintenanceMode ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

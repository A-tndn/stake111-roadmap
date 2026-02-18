'use client';

import { useEffect, useState } from 'react';
import { masterService } from '@/services/master.service';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import StatsCard from '@/components/admin/StatsCard';
import {
  FileText, DollarSign, Users, Trophy, TrendingUp, BarChart2,
} from 'lucide-react';

export default function MasterReportsPage() {
  const [financial, setFinancial] = useState<any>(null);
  const [users, setUsers] = useState<any>(null);
  const [matches, setMatches] = useState<any>(null);
  const [agents, setAgents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('financial');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const [finRes, usrRes, matchRes, agentRes] = await Promise.all([
        masterService.getFinancialReport(dateRange.startDate ? dateRange : undefined),
        masterService.getUserReport(dateRange.startDate ? dateRange : undefined),
        masterService.getMatchReport(dateRange.startDate ? dateRange : undefined),
        masterService.getAgentReport(dateRange.startDate ? dateRange : undefined),
      ]);
      setFinancial((finRes as any)?.data || {});
      setUsers((usrRes as any)?.data || {});
      setMatches((matchRes as any)?.data || {});
      setAgents((agentRes as any)?.data || {});
    } catch (err) { console.error('Failed to load reports', err); }
    finally { setLoading(false); }
  };

  const handleFilter = () => {
    setLoading(true);
    loadReports();
  };

  const tabs = [
    { key: 'financial', label: 'Financial', icon: DollarSign },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'matches', label: 'Matches', icon: Trophy },
    { key: 'agents', label: 'Agents', icon: BarChart2 },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-brand-gold" /> Platform Reports
      </h2>

      {/* Date Filter */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
          <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">End Date</label>
          <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <button onClick={handleFilter} className="px-4 py-2 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
          Apply Filter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition',
              activeTab === key ? 'bg-card shadow text-brand-gold' : 'text-muted-foreground hover:text-foreground'
            )}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-card rounded-xl border h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatsCard title="Total Revenue" value={formatCurrency(financial?.totalRevenue || 0)} icon={DollarSign} color="green" />
                <StatsCard title="Total Payouts" value={formatCurrency(financial?.totalPayouts || 0)} icon={TrendingUp} color="red" />
                <StatsCard title="Net Profit" value={formatCurrency(financial?.netProfit || 0)} icon={BarChart2}
                  color={Number(financial?.netProfit || 0) >= 0 ? 'green' : 'red'} />
                <StatsCard title="Commissions Paid" value={formatCurrency(financial?.commissionsPaid || 0)} icon={DollarSign} color="orange" />
              </div>
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold text-foreground text-sm mb-4">Financial Breakdown</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Total Bet Volume', value: formatCurrency(financial?.totalBetVolume || 0) },
                    { label: 'Total Deposits', value: formatCurrency(financial?.totalDeposits || 0) },
                    { label: 'Total Withdrawals', value: formatCurrency(financial?.totalWithdrawals || 0) },
                    { label: 'Platform P&L', value: formatCurrency(financial?.platformPnL || 0) },
                    { label: 'Pending Settlements', value: formatCurrency(financial?.pendingSettlements || 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between p-2 border-b last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatsCard title="Total Users" value={users?.totalUsers || 0} icon={Users} color="blue" />
                <StatsCard title="Active Users" value={users?.activeUsers || 0} icon={Users} color="green" />
                <StatsCard title="New Users" value={users?.newUsers || 0} icon={Users} color="purple" subtitle="This period" />
                <StatsCard title="Suspended" value={users?.suspendedUsers || 0} icon={Users} color="red" />
              </div>
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold text-foreground text-sm mb-4">User Metrics</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Users with Bets', value: users?.usersWithBets || 0 },
                    { label: 'Avg Balance', value: formatCurrency(users?.avgBalance || 0) },
                    { label: 'Total User Balances', value: formatCurrency(users?.totalBalances || 0) },
                    { label: 'Blocked Users', value: users?.blockedUsers || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between p-2 border-b last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatsCard title="Total Matches" value={matches?.totalMatches || 0} icon={Trophy} color="blue" />
                <StatsCard title="Completed" value={matches?.completedMatches || 0} icon={Trophy} color="green" />
                <StatsCard title="Live Now" value={matches?.liveMatches || 0} icon={Trophy} color="red" />
                <StatsCard title="Upcoming" value={matches?.upcomingMatches || 0} icon={Trophy} color="orange" />
              </div>
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold text-foreground text-sm mb-4">Match Metrics</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Total Bets on Matches', value: matches?.totalBets || 0 },
                    { label: 'Total Bet Volume', value: formatCurrency(matches?.totalBetVolume || 0) },
                    { label: 'Settled Matches', value: matches?.settledMatches || 0 },
                    { label: 'Unsettled Matches', value: matches?.unsettledMatches || 0 },
                    { label: 'Cancelled Matches', value: matches?.cancelledMatches || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between p-2 border-b last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatsCard title="Total Agents" value={agents?.totalAgents || 0} icon={BarChart2} color="blue" />
                <StatsCard title="Active Agents" value={agents?.activeAgents || 0} icon={BarChart2} color="green" />
                <StatsCard title="Total Commission" value={formatCurrency(agents?.totalCommission || 0)} icon={DollarSign} color="orange" />
                <StatsCard title="Avg Players/Agent" value={agents?.avgPlayersPerAgent || 0} icon={Users} color="purple" />
              </div>
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold text-foreground text-sm mb-4">Agent Breakdown</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Super Masters', value: agents?.superMasters || 0 },
                    { label: 'Masters', value: agents?.masters || 0 },
                    { label: 'Agents', value: agents?.agentCount || 0 },
                    { label: 'Total Credit Given', value: formatCurrency(agents?.totalCreditGiven || 0) },
                    { label: 'Pending Settlements', value: agents?.pendingSettlements || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between p-2 border-b last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

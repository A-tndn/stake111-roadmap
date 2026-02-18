'use client';

import { useEffect, useState } from 'react';
import { masterService } from '@/services/master.service';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Shield, Search, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    module: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filters.action) params.action = filters.action;
      if (filters.module) params.module = filters.module;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res: any = await masterService.getAuditLogs(params);
      const data = res?.data?.logs || res?.data || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) { console.error('Failed to load audit logs', err); }
    finally { setLoading(false); }
  };

  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-muted text-foreground',
    APPROVE: 'bg-green-100 text-green-700',
    REJECT: 'bg-red-100 text-red-700',
    SETTLE: 'bg-orange-100 text-orange-700',
  };

  const filtered = logs.filter((log: any) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      log.user?.displayName?.toLowerCase().includes(search) ||
      log.user?.username?.toLowerCase().includes(search) ||
      log.action?.toLowerCase().includes(search) ||
      log.resource?.toLowerCase().includes(search) ||
      log.module?.toLowerCase().includes(search)
    );
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-brand-gold" /> Audit Logs
      </h2>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search logs..." value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
          <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm bg-card">
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="SETTLE">Settle</option>
          </select>
          <select value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm bg-card">
            <option value="">All Modules</option>
            <option value="AUTH">Auth</option>
            <option value="USER">User</option>
            <option value="MATCH">Match</option>
            <option value="BET">Bet</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="SETTLEMENT">Settlement</option>
            <option value="SETTINGS">Settings</option>
          </select>
          <div>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm" placeholder="Start" />
          </div>
          <div>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm" placeholder="End" />
          </div>
          <button onClick={loadLogs}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-gold text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
            <Filter className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  {['User', 'Action', 'Module', 'Resource', 'IP Address', 'Method', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((log: any, idx: number) => (
                  <tr key={log.id || idx} className="hover:bg-muted">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{log.user?.displayName || log.userId || 'System'}</p>
                      <p className="text-[10px] text-muted-foreground">{log.userType}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold',
                        actionColors[log.action] || 'bg-muted text-foreground'
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.module || '-'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">
                      {log.resource}{log.resourceId ? ` #${log.resourceId.substring(0, 8)}` : ''}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{log.ipAddress || '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs font-medium',
                        log.requestMethod === 'POST' ? 'text-green-600' :
                          log.requestMethod === 'PUT' ? 'text-blue-600' :
                            log.requestMethod === 'DELETE' ? 'text-red-600' : 'text-muted-foreground'
                      )}>
                        {log.requestMethod || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium',
                        log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {log.status || 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(log.createdAt)}</td>
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

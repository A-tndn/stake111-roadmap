import { api } from '@/lib/api';

export const analyticsService = {
  // Platform stats (Master only)
  getPlatformStats: () => api.get('/analytics/platform'),

  // Today's summary
  getTodaySummary: (agentId?: string) => {
    const params = agentId ? `?agentId=${agentId}` : '';
    return api.get(`/analytics/today${params}`);
  },

  // Revenue data
  getRevenueData: (params?: { period?: string; startDate?: string; endDate?: string; agentId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.set('period', params.period);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.agentId) searchParams.set('agentId', params.agentId);
    return api.get(`/analytics/revenue?${searchParams.toString()}`);
  },

  // User analytics
  getUserGrowth: (days?: number) => {
    const params = days ? `?days=${days}` : '';
    return api.get(`/analytics/users/growth${params}`);
  },

  getTopBettors: (limit?: number, agentId?: string) => {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', limit.toString());
    if (agentId) searchParams.set('agentId', agentId);
    return api.get(`/analytics/users/top-bettors?${searchParams.toString()}`);
  },

  // Match analytics
  getMatchPnL: (limit?: number, agentId?: string) => {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', limit.toString());
    if (agentId) searchParams.set('agentId', agentId);
    return api.get(`/analytics/matches/pnl?${searchParams.toString()}`);
  },

  // Agent analytics (Master only)
  getAgentPerformance: (agentId?: string) => {
    const params = agentId ? `?agentId=${agentId}` : '';
    return api.get(`/analytics/agents/performance${params}`);
  },

  // Casino analytics (Master only)
  getCasinoAnalytics: () => api.get('/analytics/casino'),
};

import { api } from '@/lib/api';

class AdminService {
  // ============ DASHBOARD ============
  async getDashboardStats() {
    return await api.get<any>('/admin/dashboard');
  }

  // ============ CLIENTS ============
  async getClients(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    return await api.get<any>('/admin/clients', { params });
  }

  async getClientById(id: string) {
    return await api.get<any>(`/admin/clients/${id}`);
  }

  async updateClient(id: string, data: any) {
    return await api.put<any>(`/admin/clients/${id}`, data);
  }

  async toggleClientLock(id: string) {
    return await api.put<any>(`/admin/clients/${id}/lock`);
  }

  async toggleClientBetLock(id: string) {
    return await api.put<any>(`/admin/clients/${id}/bet-lock`);
  }

  async bulkUpdateLimits(data: { clientIds: string[]; creditLimit?: number; matchLimit?: number; sessionLimit?: number; minBet?: number; maxBet?: number }) {
    return await api.put<any>('/admin/clients/bulk-limits', data);
  }

  async getClientReport(id: string, params?: { startDate?: string; endDate?: string }) {
    return await api.get<any>(`/admin/clients/${id}/report`, { params });
  }

  // ============ MATCHES ============
  async getCurrentMatches() {
    return await api.get<any>('/admin/matches/current');
  }

  async getCompletedMatches(params?: { page?: number; limit?: number }) {
    return await api.get<any>('/admin/matches/completed', { params });
  }

  async updateMatchOdds(id: string, odds: any) {
    return await api.put<any>(`/admin/matches/${id}/odds`, odds);
  }

  async toggleMatchBetting(id: string) {
    return await api.put<any>(`/admin/matches/${id}/toggle-betting`);
  }

  async getMatchBets(id: string, params?: { page?: number; limit?: number }) {
    return await api.get<any>(`/admin/matches/${id}/bets`, { params });
  }

  async settleMatch(id: string, result: { winner: string; [key: string]: any }) {
    return await api.put<any>(`/matches/${id}/settle`, result);
  }

  async voidMatch(id: string, reason?: string) {
    return await api.put<any>(`/matches/${id}/void`, { reason });
  }

  // ============ DEPOSITS ============
  async getPendingDeposits(params?: { page?: number; limit?: number }) {
    return await api.get<any>('/deposits', { params: { ...params, status: 'PENDING' } });
  }

  async approveDeposit(id: string) {
    return await api.put<any>(`/deposits/${id}/approve`);
  }

  async rejectDeposit(id: string, remarks?: string) {
    return await api.put<any>(`/deposits/${id}/reject`, { remarks });
  }

  // ============ WITHDRAWALS ============
  async getPendingWithdrawals(params?: { page?: number; limit?: number }) {
    return await api.get<any>('/withdrawals', { params: { ...params, status: 'PENDING' } });
  }

  async approveWithdrawal(id: string) {
    return await api.put<any>(`/withdrawals/${id}/approve`);
  }

  async rejectWithdrawal(id: string, remarks?: string) {
    return await api.put<any>(`/withdrawals/${id}/reject`, { remarks });
  }

  // ============ REPORTS ============
  async getMyReports(params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) {
    return await api.get<any>('/admin/reports', { params });
  }

  // ============ LEDGER ============
  async getUserLedger(userId: string, params?: { page?: number; limit?: number; type?: string }) {
    return await api.get<any>(`/admin/ledger/${userId}`, { params });
  }
}

export const adminService = new AdminService();

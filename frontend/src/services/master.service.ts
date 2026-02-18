import { api } from '@/lib/api';

class MasterService {
  // ============ DASHBOARD ============
  async getDashboardStats() {
    return await api.get<any>('/master/dashboard/stats');
  }

  // ============ ADMINS / AGENTS ============
  async getAdmins(params?: { page?: number; limit?: number; status?: string; type?: string; search?: string }) {
    return await api.get<any>('/master/admins', { params });
  }

  async getAdminById(id: string) {
    return await api.get<any>(`/master/admins/${id}`);
  }

  async createAdmin(data: {
    username: string;
    password: string;
    displayName: string;
    phone: string;
    email?: string;
    agentType: 'SUPER_MASTER' | 'MASTER' | 'AGENT';
    parentAgentId?: string;
    commissionRate?: number;
    creditLimit?: number;
    permissions?: string[];
    maxPlayersAllowed?: number;
    sportSharePercent?: number;
  }) {
    return await api.post<any>('/master/admins', data);
  }

  async updateAdmin(id: string, data: any) {
    return await api.put<any>(`/master/admins/${id}`, data);
  }

  async deleteAdmin(id: string) {
    return await api.delete<any>(`/master/admins/${id}`);
  }

  async toggleAdminLock(id: string) {
    return await api.put<any>(`/master/admins/${id}/toggle-lock`);
  }

  async toggleAdminBetLock(id: string) {
    return await api.put<any>(`/master/admins/${id}/toggle-bet-lock`);
  }

  async resetAdminPassword(id: string, data: { newPassword: string }) {
    return await api.post<any>(`/master/admins/${id}/reset-password`, data);
  }

  async updateAdminPermissions(id: string, permissions: string[]) {
    return await api.put<any>(`/master/admins/${id}/permissions`, { permissions });
  }

  async getAdminClients(id: string, params?: { page?: number; limit?: number }) {
    return await api.get<any>(`/master/admins/${id}/clients`, { params });
  }

  async getAdminHierarchy() {
    return await api.get<any>('/master/admins/hierarchy');
  }

  // ============ SETTLEMENTS ============
  async getSettlements(params?: { agentId?: string; status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    return await api.get<any>('/master/settlements', { params });
  }

  async getSettlementById(id: string) {
    return await api.get<any>(`/master/settlements/${id}`);
  }

  async generateSettlement(data: { agentId: string; periodStart: string; periodEnd: string }) {
    return await api.post<any>('/master/settlements/generate', data);
  }

  async generateAllSettlements(data: { periodStart: string; periodEnd: string }) {
    return await api.post<any>('/master/settlements/generate-all', data);
  }

  async approveSettlement(id: string) {
    return await api.put<any>(`/master/settlements/${id}/approve`);
  }

  async paySettlement(id: string, data: { paymentMethod: string; paymentProof?: string; paymentTransactionId?: string; remarks?: string }) {
    return await api.put<any>(`/master/settlements/${id}/pay`, data);
  }

  async rejectSettlement(id: string, remarks?: string) {
    return await api.put<any>(`/master/settlements/${id}/reject`, { remarks });
  }

  // ============ SYSTEM SETTINGS ============
  async getSettings() {
    return await api.get<any>('/master/settings');
  }

  async updateSettings(data: any) {
    return await api.put<any>('/master/settings', data);
  }

  async updateCommissionStructure(data: any) {
    return await api.put<any>('/master/settings/commission', data);
  }

  async updateBettingLimits(data: any) {
    return await api.put<any>('/master/settings/betting-limits', data);
  }

  async toggleMaintenanceMode() {
    return await api.post<any>('/master/settings/maintenance-mode');
  }

  // ============ REPORTS ============
  async getFinancialReport(params?: { startDate?: string; endDate?: string; groupBy?: string }) {
    return await api.get<any>('/master/reports/financial', { params });
  }

  async getUserReport(params?: { startDate?: string; endDate?: string }) {
    return await api.get<any>('/master/reports/users', { params });
  }

  async getMatchReport(params?: { startDate?: string; endDate?: string }) {
    return await api.get<any>('/master/reports/matches', { params });
  }

  async getAgentReport(params?: { startDate?: string; endDate?: string }) {
    return await api.get<any>('/master/reports/agents', { params });
  }

  // ============ TRANSACTIONS ============
  async getAllTransactions(params?: { page?: number; limit?: number; type?: string; userId?: string; startDate?: string; endDate?: string }) {
    return await api.get<any>('/master/transactions', { params });
  }

  // ============ AUDIT LOGS ============
  async getAuditLogs(params?: { page?: number; limit?: number; userId?: string; action?: string; module?: string; startDate?: string; endDate?: string }) {
    return await api.get<any>('/master/audit-logs', { params });
  }

  // ============ GLOBAL MATCHES ============
  async getAllMatches(params?: { page?: number; limit?: number; status?: string }) {
    return await api.get<any>('/matches', { params });
  }

  async createMatch(data: any) {
    return await api.post<any>('/matches', data);
  }

  async importMatchesFromAPI() {
    return await api.post<any>('/matches/import');
  }
}

export const masterService = new MasterService();

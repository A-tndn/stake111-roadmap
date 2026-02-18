import { api } from '@/lib/api';

class WithdrawalService {
  async createRequest(data: { amount: number; paymentMethod: string; accountDetails?: string; remarks?: string }) {
    return await api.post<any>('/withdrawals', data);
  }

  async getMyWithdrawals(params?: { status?: string; page?: number; limit?: number }) {
    return await api.get<any>('/withdrawals/my', { params });
  }

  async getWithdrawalById(id: string) {
    return await api.get<any>(`/withdrawals/${id}`);
  }
}

export const withdrawalService = new WithdrawalService();

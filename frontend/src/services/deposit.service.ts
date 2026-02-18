import { api } from '@/lib/api';

class DepositService {
  async createRequest(data: { amount: number; paymentMethod: string; remarks?: string }) {
    return await api.post<any>('/deposits', data);
  }

  async getMyDeposits(params?: { status?: string; page?: number; limit?: number }) {
    return await api.get<any>('/deposits/my', { params });
  }

  async getDepositById(id: string) {
    return await api.get<any>(`/deposits/${id}`);
  }
}

export const depositService = new DepositService();

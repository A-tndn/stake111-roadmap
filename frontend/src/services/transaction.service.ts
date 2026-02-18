import { api } from '@/lib/api';

class TransactionService {
  async getMyTransactions(params?: { type?: string; page?: number; limit?: number }) {
    return await api.get<any>('/bets', { params: { ...params } });
  }

  async getAccountStatement(params?: { page?: number; limit?: number }) {
    return await api.get<any>('/bets', { params: { ...params, includeTransactions: true } });
  }
}

export const transactionService = new TransactionService();

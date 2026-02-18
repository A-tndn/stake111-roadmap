import { api } from '@/lib/api';

class CasinoService {
  async getGames() {
    return await api.get<any>('/casino/games');
  }

  async getGameById(id: string) {
    return await api.get<any>(`/casino/games/${id}`);
  }

  async placeBet(data: { roundId: string; betType: string; betData?: any; amount: number }) {
    return await api.post<any>('/casino/bets', data);
  }

  /**
   * Instant play — bet + generate result + settle in one call
   */
  async instantPlay(data: { gameId: string; betType: string; betData?: any; amount: number; clientSeed?: string }) {
    return await api.post<any>('/casino/play', data);
  }

  async getBetHistory(params?: { page?: number; limit?: number }) {
    return await api.get<any>('/casino/bets/history', { params });
  }

  // Admin endpoints
  async createGame(data: any) {
    return await api.post<any>('/casino/games', data);
  }

  async updateGame(id: string, data: any) {
    return await api.put<any>(`/casino/games/${id}`, data);
  }

  async toggleGame(id: string) {
    return await api.put<any>(`/casino/games/${id}/toggle`);
  }
}

export const casinoService = new CasinoService();

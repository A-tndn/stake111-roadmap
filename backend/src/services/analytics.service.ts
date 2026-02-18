import prisma from '../db';
import logger from '../config/logger';

class AnalyticsService {
  // ============================================
  // REVENUE & FINANCIAL ANALYTICS
  // ============================================

  /**
   * Get revenue data grouped by time period
   */
  async getRevenueData(params: {
    period: 'daily' | 'weekly' | 'monthly';
    startDate?: Date;
    endDate?: Date;
    agentId?: string;
  }) {
    const { period, agentId } = params;
    const endDate = params.endDate || new Date();
    const startDate = params.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const truncExpr = period === 'daily'
      ? `date_trunc('day', "createdAt")`
      : period === 'weekly'
        ? `date_trunc('week', "createdAt")`
        : `date_trunc('month', "createdAt")`;

    let agentFilter = '';
    const queryParams: any[] = [startDate, endDate];

    if (agentId) {
      agentFilter = `AND "userId" IN (SELECT id FROM "User" WHERE "agentId" = $3)`;
      queryParams.push(agentId);
    }

    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT
          ${truncExpr} as period,
          COUNT(CASE WHEN type = 'BET' THEN 1 END) as total_bets,
          COALESCE(SUM(CASE WHEN type = 'BET' THEN amount END), 0) as total_bet_amount,
          COALESCE(SUM(CASE WHEN type = 'WIN' THEN amount END), 0) as total_win_amount,
          COALESCE(SUM(CASE WHEN type = 'BET' THEN amount END), 0) - COALESCE(SUM(CASE WHEN type = 'WIN' THEN amount END), 0) as net_revenue,
          COUNT(CASE WHEN type = 'DEPOSIT' AND status = 'APPROVED' THEN 1 END) as total_deposits,
          COALESCE(SUM(CASE WHEN type = 'DEPOSIT' AND status = 'APPROVED' THEN amount END), 0) as total_deposit_amount,
          COUNT(CASE WHEN type = 'WITHDRAWAL' AND status = 'APPROVED' THEN 1 END) as total_withdrawals,
          COALESCE(SUM(CASE WHEN type = 'WITHDRAWAL' AND status = 'APPROVED' THEN amount END), 0) as total_withdrawal_amount
        FROM "Transaction"
        WHERE "createdAt" >= $1 AND "createdAt" <= $2 ${agentFilter}
        GROUP BY ${truncExpr}
        ORDER BY period ASC
      `, ...queryParams);

      return result;
    } catch (err) {
      logger.error('Failed to get revenue data', err);
      return [];
    }
  }

  /**
   * Get overall platform statistics
   */
  async getPlatformStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        totalAgents,
        totalBets,
        totalBetAmount,
        totalWinAmount,
        totalDeposits,
        totalWithdrawals,
        pendingDeposits,
        pendingWithdrawals,
        totalCasinoGames,
        casinoBets,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.agent.count(),
        prisma.bet.count(),
        prisma.bet.aggregate({ _sum: { amount: true } }),
        prisma.bet.aggregate({ _sum: { actualWin: true }, where: { status: 'WON' } }),
        prisma.depositRequest.count({ where: { status: 'APPROVED' } }),
        prisma.withdrawalRequest.count({ where: { status: 'APPROVED' } }),
        prisma.depositRequest.count({ where: { status: 'PENDING' } }),
        prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
        prisma.casinoGame.count({ where: { enabled: true } }),
        prisma.casinoBet.count(),
      ]);

      return {
        users: { total: totalUsers, active: activeUsers, agents: totalAgents },
        betting: {
          totalBets,
          totalBetAmount: totalBetAmount._sum.amount || 0,
          totalWinAmount: totalWinAmount._sum.actualWin || 0,
          platformProfit: Number(totalBetAmount._sum.amount || 0) - Number(totalWinAmount._sum.actualWin || 0),
        },
        finance: {
          totalDeposits,
          totalWithdrawals,
          pendingDeposits,
          pendingWithdrawals,
        },
        casino: {
          totalGames: totalCasinoGames,
          totalBets: casinoBets,
        },
      };
    } catch (err) {
      logger.error('Failed to get platform stats', err);
      throw err;
    }
  }

  // ============================================
  // USER ANALYTICS
  // ============================================

  /**
   * Get user growth over time
   */
  async getUserGrowth(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT
          date_trunc('day', "createdAt") as date,
          COUNT(*) as new_users,
          SUM(COUNT(*)) OVER (ORDER BY date_trunc('day', "createdAt")) as cumulative_users
        FROM "User"
        WHERE "createdAt" >= $1 AND role = 'PLAYER'
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date ASC
      `, startDate);

      return result;
    } catch (err) {
      logger.error('Failed to get user growth', err);
      return [];
    }
  }

  /**
   * Get top bettors
   */
  async getTopBettors(limit = 10, agentId?: string) {
    const where: any = {};
    if (agentId) {
      where.user = { agentId };
    }

    try {
      const topBettors = await prisma.bet.groupBy({
        by: ['userId'],
        where,
        _sum: { amount: true, actualWin: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: limit,
      });

      const userIds = topBettors.map(b => b.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, displayName: true, balance: true },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      return topBettors.map(b => ({
        user: userMap.get(b.userId),
        totalBets: b._count.id,
        totalBetAmount: b._sum.amount,
        totalWinAmount: b._sum.actualWin,
        profit: Number(b._sum.actualWin || 0) - Number(b._sum.amount || 0),
      }));
    } catch (err) {
      logger.error('Failed to get top bettors', err);
      return [];
    }
  }

  // ============================================
  // MATCH ANALYTICS
  // ============================================

  /**
   * Get match-wise P&L
   */
  async getMatchPnL(params?: { limit?: number; agentId?: string }) {
    const limit = params?.limit || 20;

    try {
      const matches = await prisma.match.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { startTime: 'desc' },
        take: limit,
        include: {
          bets: {
            select: {
              amount: true,
              actualWin: true,
              status: true,
            },
          },
        },
      });

      return matches.map((match: any) => {
        const bets = match.bets || [];
        const totalBets = bets.length;
        const totalBetAmount = bets.reduce((sum: number, b: any) => sum + Number(b.amount), 0);
        const totalWinPaid = bets
          .filter((b: any) => b.status === 'WON')
          .reduce((sum: number, b: any) => sum + Number(b.actualWin || 0), 0);
        const platformPnL = totalBetAmount - totalWinPaid;

        return {
          id: match.id,
          name: match.name,
          team1: match.team1,
          team2: match.team2,
          startTime: match.startTime,
          matchWinner: match.matchWinner,
          totalBets,
          totalBetAmount,
          totalWinPaid,
          platformPnL,
        };
      });
    } catch (err) {
      logger.error('Failed to get match P&L', err);
      return [];
    }
  }

  // ============================================
  // AGENT ANALYTICS
  // ============================================

  /**
   * Get agent performance breakdown
   */
  async getAgentPerformance(agentId?: string) {
    try {
      const where: any = {};
      if (agentId) where.id = agentId;

      const agents = await prisma.agent.findMany({
        where,
        select: {
          id: true,
          username: true,
          displayName: true,
          agentType: true,
          status: true,
          balance: true,
          commissionRate: true,
          totalClients: true,
          _count: {
            select: { players: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const agentStats = await Promise.all(
        agents.map(async (agent) => {
          const clientIds = await prisma.user.findMany({
            where: { agentId: agent.id },
            select: { id: true },
          });
          const ids = clientIds.map(c => c.id);

          let betStats = { totalBets: 0, totalAmount: 0, totalWin: 0 };
          if (ids.length > 0) {
            const agg = await prisma.bet.aggregate({
              where: { userId: { in: ids } },
              _count: { id: true },
              _sum: { amount: true, actualWin: true },
            });
            betStats = {
              totalBets: agg._count.id,
              totalAmount: Number(agg._sum.amount || 0),
              totalWin: Number(agg._sum.actualWin || 0),
            };
          }

          return {
            agent: {
              id: agent.id,
              username: agent.username,
              displayName: agent.displayName,
              agentType: agent.agentType,
              status: agent.status,
              balance: agent.balance,
              commissionRate: agent.commissionRate,
              clientCount: agent._count.players,
            },
            betting: betStats,
            revenue: betStats.totalAmount - betStats.totalWin,
          };
        })
      );

      return agentStats;
    } catch (err) {
      logger.error('Failed to get agent performance', err);
      return [];
    }
  }

  // ============================================
  // CASINO ANALYTICS
  // ============================================

  /**
   * Get casino game analytics
   */
  async getCasinoAnalytics() {
    try {
      const games = await prisma.casinoGame.findMany({
        include: {
          rounds: {
            include: {
              bets: {
                select: {
                  amount: true,
                  actualWin: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      return games.map((game: any) => {
        const allBets = (game.rounds || []).flatMap((r: any) => r.bets || []);
        const totalBets = allBets.length;
        const totalWagered = allBets.reduce((sum: number, b: any) => sum + Number(b.amount), 0);
        const totalWon = allBets
          .filter((b: any) => b.status === 'WON')
          .reduce((sum: number, b: any) => sum + Number(b.actualWin || 0), 0);
        const actualRtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;

        return {
          id: game.id,
          gameName: game.gameName,
          gameType: game.gameType,
          enabled: game.enabled,
          configuredRtp: Number(game.rtp),
          totalBets,
          totalWagered,
          totalWon,
          houseProfit: totalWagered - totalWon,
          actualRtp: Math.round(actualRtp * 100) / 100,
        };
      });
    } catch (err) {
      logger.error('Failed to get casino analytics', err);
      return [];
    }
  }

  // ============================================
  // DAILY SUMMARY (for dashboard widgets)
  // ============================================

  /**
   * Get today's summary stats
   */
  async getTodaySummary(agentId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userWhere: any = agentId ? { agentId } : {};
    const betWhere: any = { createdAt: { gte: today, lt: tomorrow } };
    if (agentId) {
      betWhere.user = { agentId };
    }

    try {
      const [
        newUsers,
        betsToday,
        depositsToday,
        withdrawalsToday,
      ] = await Promise.all([
        prisma.user.count({
          where: { ...userWhere, createdAt: { gte: today, lt: tomorrow }, role: 'PLAYER' },
        }),
        prisma.bet.aggregate({
          where: betWhere,
          _count: { id: true },
          _sum: { amount: true, actualWin: true },
        }),
        prisma.depositRequest.aggregate({
          where: { createdAt: { gte: today, lt: tomorrow }, status: 'APPROVED' },
          _count: { id: true },
          _sum: { amount: true },
        }),
        prisma.withdrawalRequest.aggregate({
          where: { createdAt: { gte: today, lt: tomorrow }, status: 'APPROVED' },
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);

      return {
        newUsers,
        bets: {
          count: betsToday._count.id,
          totalAmount: Number(betsToday._sum.amount || 0),
          totalWin: Number(betsToday._sum.actualWin || 0),
          profit: Number(betsToday._sum.amount || 0) - Number(betsToday._sum.actualWin || 0),
        },
        deposits: {
          count: depositsToday._count.id,
          amount: Number(depositsToday._sum.amount || 0),
        },
        withdrawals: {
          count: withdrawalsToday._count.id,
          amount: Number(withdrawalsToday._sum.amount || 0),
        },
      };
    } catch (err) {
      logger.error('Failed to get today summary', err);
      throw err;
    }
  }
}

export default new AnalyticsService();

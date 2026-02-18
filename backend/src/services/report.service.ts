import prisma from '../db';
import { Decimal } from '@prisma/client/runtime/library';

class ReportService {
  /**
   * Get user-wise profit/loss report
   */
  async getUserReport(filters: {
    userId?: string;
    agentId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { userId, agentId, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Get users scoped to agent if provided
    const userWhere: any = {};
    if (userId) userWhere.id = userId;
    if (agentId) userWhere.agentId = agentId;

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        username: true,
        displayName: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        createdAt: true,
        bets: {
          where: {
            status: { in: ['WON', 'LOST'] },
            ...(startDate || endDate
              ? {
                  createdAt: {
                    ...(startDate ? { gte: startDate } : {}),
                    ...(endDate ? { lte: endDate } : {}),
                  },
                }
              : {}),
          },
          select: { amount: true, actualWin: true, status: true },
        },
      },
      skip,
      take: limit,
    });

    const report = users.map((user) => {
      let totalBetAmount = new Decimal(0);
      let totalWinAmount = new Decimal(0);
      let totalBets = user.bets.length;
      let wonBets = 0;
      let lostBets = 0;

      for (const bet of user.bets) {
        totalBetAmount = totalBetAmount.add(bet.amount);
        if (bet.status === 'WON' && bet.actualWin) {
          totalWinAmount = totalWinAmount.add(bet.actualWin);
          wonBets++;
        } else {
          lostBets++;
        }
      }

      const profitLoss = totalWinAmount.sub(totalBetAmount);

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        balance: user.balance,
        totalDeposited: user.totalDeposited,
        totalWithdrawn: user.totalWithdrawn,
        totalBets,
        wonBets,
        lostBets,
        totalBetAmount,
        totalWinAmount,
        profitLoss,
        winRate: totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : '0.0',
        joinedAt: user.createdAt,
      };
    });

    const total = await prisma.user.count({ where: userWhere });

    return {
      report,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get match-wise report
   */
  async getMatchReport(filters: {
    matchId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { matchId, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { status: { in: ['COMPLETED', 'LIVE'] } };
    if (matchId) where.id = matchId;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        bets: {
          select: { amount: true, actualWin: true, status: true, potentialWin: true },
        },
      },
      orderBy: { startTime: 'desc' },
      skip,
      take: limit,
    });

    const report = matches.map((match) => {
      let totalBetAmount = new Decimal(0);
      let totalPayoutAmount = new Decimal(0);
      let totalBets = match.bets.length;
      let settledBets = 0;
      let pendingBets = 0;

      for (const bet of match.bets) {
        totalBetAmount = totalBetAmount.add(bet.amount);
        if (bet.status === 'WON' && bet.actualWin) {
          totalPayoutAmount = totalPayoutAmount.add(bet.actualWin);
          settledBets++;
        } else if (bet.status === 'LOST') {
          settledBets++;
        } else if (bet.status === 'PENDING') {
          pendingBets++;
        }
      }

      const platformPL = totalBetAmount.sub(totalPayoutAmount);

      return {
        id: match.id,
        name: match.name,
        team1: match.team1,
        team2: match.team2,
        matchType: match.matchType,
        status: match.status,
        startTime: match.startTime,
        matchWinner: match.matchWinner,
        isSettled: match.isSettled,
        totalBets,
        settledBets,
        pendingBets,
        totalBetAmount,
        totalPayoutAmount,
        platformPL,
      };
    });

    const total = await prisma.match.count({ where });

    return {
      report,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get financial P&L report
   */
  async getFinancialReport(filters: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'DAY' | 'WEEK' | 'MONTH';
  }) {
    const { startDate, endDate, groupBy = 'DAY' } = filters;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get total deposits
    const deposits = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get total withdrawals
    const withdrawals = await prisma.transaction.aggregate({
      where: {
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get total bets placed
    const betsPlaced = await prisma.transaction.aggregate({
      where: {
        type: 'BET_PLACED',
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get total bet winnings
    const betsWon = await prisma.transaction.aggregate({
      where: {
        type: 'BET_WON',
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get total commissions
    const commissions = await prisma.transaction.aggregate({
      where: {
        type: 'COMMISSION_EARNED',
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalDeposits = deposits._sum.amount || new Decimal(0);
    const totalWithdrawals = withdrawals._sum.amount || new Decimal(0);
    const totalBetsPlaced = betsPlaced._sum.amount || new Decimal(0);
    const totalBetsWon = betsWon._sum.amount || new Decimal(0);
    const totalCommissions = commissions._sum.amount || new Decimal(0);

    const netBettingRevenue = totalBetsPlaced.sub(totalBetsWon);
    const grossProfit = netBettingRevenue.sub(totalCommissions);

    return {
      summary: {
        totalDeposits,
        totalWithdrawals,
        netCashFlow: totalDeposits.sub(totalWithdrawals),
        totalBetsPlaced,
        totalBetsWon,
        netBettingRevenue,
        totalCommissions,
        grossProfit,
        depositCount: deposits._count,
        withdrawalCount: withdrawals._count,
        betCount: betsPlaced._count,
      },
    };
  }

  /**
   * Get platform overview stats
   */
  async getPlatformOverview() {
    const [
      totalUsers,
      activeUsers,
      totalAgents,
      activeAgents,
      totalMatches,
      liveMatches,
      pendingDeposits,
      pendingWithdrawals,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PLAYER' } }),
      prisma.user.count({ where: { role: 'PLAYER', status: 'ACTIVE' } }),
      prisma.agent.count(),
      prisma.agent.count({ where: { status: 'ACTIVE' } }),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'LIVE' } }),
      prisma.depositRequest.count({ where: { status: 'PENDING' } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
    ]);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayDeposits, todayWithdrawals, todayBets] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: today } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: 'WITHDRAWAL', status: 'COMPLETED', createdAt: { gte: today } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.bet.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      agents: { total: totalAgents, active: activeAgents },
      matches: { total: totalMatches, live: liveMatches },
      pending: { deposits: pendingDeposits, withdrawals: pendingWithdrawals },
      today: {
        deposits: { amount: todayDeposits._sum.amount || 0, count: todayDeposits._count },
        withdrawals: { amount: todayWithdrawals._sum.amount || 0, count: todayWithdrawals._count },
        bets: { amount: todayBets._sum.amount || 0, count: todayBets._count },
      },
    };
  }

  /**
   * Get agent-wise revenue report
   */
  async getAgentReport(agentId?: string) {
    const where: any = {};
    if (agentId) where.id = agentId;

    const agents = await prisma.agent.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        agentType: true,
        commissionRate: true,
        totalCommission: true,
        pendingSettlement: true,
        balance: true,
        totalClients: true,
        activeClients: true,
        totalRevenue: true,
        players: {
          select: {
            id: true,
            bets: {
              where: { status: { in: ['WON', 'LOST'] } },
              select: { amount: true, actualWin: true, status: true },
            },
          },
        },
      },
    });

    return agents.map((agent) => {
      let totalBetAmount = new Decimal(0);
      let totalPayoutAmount = new Decimal(0);
      let totalBets = 0;

      for (const player of agent.players) {
        for (const bet of player.bets) {
          totalBets++;
          totalBetAmount = totalBetAmount.add(bet.amount);
          if (bet.status === 'WON' && bet.actualWin) {
            totalPayoutAmount = totalPayoutAmount.add(bet.actualWin);
          }
        }
      }

      return {
        id: agent.id,
        username: agent.username,
        displayName: agent.displayName,
        agentType: agent.agentType,
        commissionRate: agent.commissionRate,
        totalCommission: agent.totalCommission,
        pendingSettlement: agent.pendingSettlement,
        balance: agent.balance,
        totalClients: agent.players.length,
        totalBets,
        totalBetAmount,
        totalPayoutAmount,
        netRevenue: totalBetAmount.sub(totalPayoutAmount),
      };
    });
  }
}

export default new ReportService();

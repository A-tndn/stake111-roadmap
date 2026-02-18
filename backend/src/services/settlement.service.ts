import prisma from '../db';
import { Decimal } from '@prisma/client/runtime/library';
import { SettlementStatus } from '@prisma/client';
import logger from '../config/logger';

class SettlementService {
  /**
   * Generate settlement for a specific agent for a given period
   */
  async generateSettlement(agentId: string, periodStart: Date, periodEnd: Date) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { players: { select: { id: true } } },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Check for existing settlement in same period
    const existing = await prisma.settlement.findFirst({
      where: {
        agentId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
        status: { notIn: ['REJECTED'] },
      },
    });

    if (existing) {
      throw new Error('Settlement already exists for this period');
    }

    const playerIds = agent.players.map((p) => p.id);

    // Calculate totals from bets placed by agent's players in the period
    const bets = await prisma.bet.findMany({
      where: {
        userId: { in: playerIds },
        createdAt: { gte: periodStart, lte: periodEnd },
        status: { in: ['WON', 'LOST'] },
      },
    });

    let totalBetAmount = new Decimal(0);
    let totalWinAmount = new Decimal(0);
    let totalLossAmount = new Decimal(0);

    for (const bet of bets) {
      totalBetAmount = totalBetAmount.add(bet.amount);
      if (bet.status === 'WON' && bet.actualWin) {
        totalWinAmount = totalWinAmount.add(bet.actualWin);
      } else if (bet.status === 'LOST') {
        totalLossAmount = totalLossAmount.add(bet.amount);
      }
    }

    const platformProfit = totalLossAmount.sub(totalWinAmount);
    const platformLoss = platformProfit.isNegative() ? platformProfit.abs() : new Decimal(0);
    const netProfit = platformProfit.isNegative() ? new Decimal(0) : platformProfit;

    // Calculate commission
    const commissionRate = agent.commissionRate;
    const commissionAmount = netProfit.mul(commissionRate).div(100);
    const previousBalance = agent.pendingSettlement;
    const settlementAmount = commissionAmount.add(previousBalance);

    // Get unpaid commissions for this agent in the period
    const unpaidCommissions = await prisma.commission.findMany({
      where: {
        agentId,
        paid: false,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    // Create settlement
    const settlement = await prisma.settlement.create({
      data: {
        agentId,
        periodStart,
        periodEnd,
        totalBetsPlaced: bets.length,
        totalBetAmount,
        totalWinAmount,
        totalLossAmount,
        platformProfit: netProfit,
        platformLoss,
        netProfit,
        commissionRate,
        commissionAmount,
        previousBalance,
        settlementAmount,
        status: 'PENDING',
        commissions: {
          connect: unpaidCommissions.map((c) => ({ id: c.id })),
        },
      },
    });

    logger.info(`Settlement generated: ${settlement.id} for agent ${agentId}`);
    return settlement;
  }

  /**
   * Approve a settlement
   */
  async approveSettlement(settlementId: string, approvedBy: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) throw new Error('Settlement not found');
    if (settlement.status !== 'PENDING') {
      throw new Error('Settlement is not in PENDING status');
    }

    return prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Mark settlement as paid
   */
  async paySettlement(
    settlementId: string,
    paidBy: string,
    paymentData: { paymentMethod: string; paymentProof?: string; paymentTransactionId?: string; remarks?: string }
  ) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { commissions: true },
    });

    if (!settlement) throw new Error('Settlement not found');
    if (settlement.status !== 'APPROVED') {
      throw new Error('Settlement must be approved before payment');
    }

    return prisma.$transaction(async (tx) => {
      // Update settlement status
      const updated = await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'PAID',
          paidBy,
          paidAt: new Date(),
          paymentMethod: paymentData.paymentMethod,
          paymentProof: paymentData.paymentProof,
          paymentTransactionId: paymentData.paymentTransactionId,
          remarks: paymentData.remarks,
        },
      });

      // Mark all related commissions as paid
      await tx.commission.updateMany({
        where: { settlementId },
        data: { paid: true, paidAt: new Date() },
      });

      // Update agent's pending settlement balance
      await tx.agent.update({
        where: { id: settlement.agentId },
        data: {
          pendingSettlement: 0,
          lastSettlement: new Date(),
        },
      });

      return updated;
    });
  }

  /**
   * Reject a settlement
   */
  async rejectSettlement(settlementId: string, remarks: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) throw new Error('Settlement not found');

    return prisma.settlement.update({
      where: { id: settlementId },
      data: { status: 'REJECTED', remarks },
    });
  }

  /**
   * Get all settlements with filters
   */
  async getSettlements(filters: {
    agentId?: string;
    status?: SettlementStatus;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { agentId, status, page = 1, limit = 20, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
          agent: {
            select: { id: true, displayName: true, username: true, agentType: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.settlement.count({ where }),
    ]);

    return {
      settlements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get settlement by ID
   */
  async getSettlementById(id: string) {
    return prisma.settlement.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, displayName: true, username: true, agentType: true, commissionRate: true },
        },
        commissions: {
          include: {
            bet: { select: { id: true, betType: true, amount: true, odds: true, status: true } },
          },
        },
      },
    });
  }

  /**
   * Generate settlements for all agents (cron job)
   */
  async generateAllSettlements(periodStart: Date, periodEnd: Date) {
    const agents = await prisma.agent.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    const results = [];
    for (const agent of agents) {
      try {
        const settlement = await this.generateSettlement(agent.id, periodStart, periodEnd);
        results.push({ agentId: agent.id, settlementId: settlement.id, status: 'success' });
      } catch (error: any) {
        results.push({ agentId: agent.id, error: error.message, status: 'failed' });
        logger.error(`Settlement generation failed for agent ${agent.id}: ${error.message}`);
      }
    }

    return results;
  }
}

export default new SettlementService();

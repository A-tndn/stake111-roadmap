import prisma from '../db';
import { DepositStatus } from '@prisma/client';
import logger from '../config/logger';
import notificationService from './notification.service';
import { emitDepositStatus, emitBalanceUpdate } from '../utils/socketEmitter';

class DepositService {
  /**
   * Create a new deposit request
   */
  async createDepositRequest(data: {
    userId: string;
    amount: number;
    paymentMethod: string;
    paymentProof?: string;
    transactionRef?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new Error('User not found');

    const deposit = await prisma.depositRequest.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentProof: data.paymentProof,
        transactionRef: data.transactionRef,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, balance: true } },
      },
    });

    logger.info(`Deposit request created: ${deposit.id} by user ${data.userId} for ${data.amount}`);

    // Notify agent about new deposit request
    if (user.agentId) {
      notificationService.notifyNewDepositRequest(user.agentId, {
        username: user.displayName || user.username,
        amount: data.amount,
      }).catch(err => logger.error('Failed to notify agent of deposit', err));
    }

    return deposit;
  }

  /**
   * Approve a deposit request — adds balance to user
   */
  async approveDeposit(depositId: string, processedBy: string, remarks?: string) {
    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
      include: { user: true },
    });

    if (!deposit) throw new Error('Deposit request not found');
    if (deposit.status !== 'PENDING') throw new Error('Deposit is not in PENDING status');

    return prisma.$transaction(async (tx) => {
      const user = deposit.user;
      const balanceBefore = user.balance;
      const balanceAfter = balanceBefore.add(deposit.amount);

      // Update deposit status
      const updated = await tx.depositRequest.update({
        where: { id: depositId },
        data: {
          status: 'APPROVED',
          processedBy,
          processedAt: new Date(),
          remarks,
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: deposit.userId },
        data: {
          balance: balanceAfter,
          totalDeposited: { increment: deposit.amount },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          amount: deposit.amount,
          balanceBefore,
          balanceAfter,
          referenceId: depositId,
          referenceType: 'DEPOSIT_REQUEST',
          processedBy,
          processedAt: new Date(),
          description: `Deposit via ${deposit.paymentMethod}`,
        },
      });

      logger.info(`Deposit ${depositId} approved by ${processedBy}. User ${deposit.userId} balance: ${balanceBefore} → ${balanceAfter}`);

      // Real-time notifications
      emitDepositStatus(deposit.userId, { depositId, status: 'APPROVED', amount: deposit.amount.toString() });
      emitBalanceUpdate(deposit.userId, balanceAfter.toString(), 'Deposit approved');

      // Persist notification
      notificationService.notifyDepositStatus(deposit.userId, {
        status: 'APPROVED',
        amount: deposit.amount.toNumber(),
      }).catch(err => logger.error('Failed to notify deposit status', err));

      return updated;
    });
  }

  /**
   * Reject a deposit request
   */
  async rejectDeposit(depositId: string, processedBy: string, remarks: string) {
    const deposit = await prisma.depositRequest.findUnique({
      where: { id: depositId },
    });

    if (!deposit) throw new Error('Deposit request not found');
    if (deposit.status !== 'PENDING') throw new Error('Deposit is not in PENDING status');

    const updated = await prisma.depositRequest.update({
      where: { id: depositId },
      data: {
        status: 'REJECTED',
        processedBy,
        processedAt: new Date(),
        remarks,
      },
    });

    // Notify user of rejection
    emitDepositStatus(deposit.userId, { depositId, status: 'REJECTED', amount: deposit.amount.toString() });
    notificationService.notifyDepositStatus(deposit.userId, {
      status: 'REJECTED',
      amount: deposit.amount.toNumber(),
    }).catch(err => logger.error('Failed to notify deposit rejection', err));

    return updated;
  }

  /**
   * Get deposit requests with filters
   */
  async getDepositRequests(filters: {
    userId?: string;
    status?: DepositStatus;
    processedBy?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { userId, status, processedBy, page = 1, limit = 20, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (processedBy) where.processedBy = processedBy;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [deposits, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, displayName: true, balance: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.depositRequest.count({ where }),
    ]);

    return {
      deposits,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get deposit by ID
   */
  async getDepositById(id: string) {
    return prisma.depositRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, balance: true, agentId: true } },
      },
    });
  }
}

export default new DepositService();

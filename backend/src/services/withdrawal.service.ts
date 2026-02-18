import prisma from '../db';
import { WithdrawalStatus } from '@prisma/client';
import logger from '../config/logger';
import notificationService from './notification.service';
import { emitWithdrawalStatus, emitBalanceUpdate } from '../utils/socketEmitter';

class WithdrawalService {
  /**
   * Create a new withdrawal request
   */
  async createWithdrawalRequest(data: {
    userId: string;
    amount: number;
    paymentMethod: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    upiId?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new Error('User not found');

    // Check sufficient balance
    if (user.balance.toNumber() < data.amount) {
      throw new Error('Insufficient balance');
    }

    // Check for pending withdrawals
    const pendingCount = await prisma.withdrawalRequest.count({
      where: { userId: data.userId, status: 'PENDING' },
    });
    if (pendingCount >= 3) {
      throw new Error('Maximum 3 pending withdrawal requests allowed');
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        accountHolderName: data.accountHolderName,
        upiId: data.upiId,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, balance: true } },
      },
    });

    logger.info(`Withdrawal request created: ${withdrawal.id} by user ${data.userId} for ${data.amount}`);

    // Notify agent about new withdrawal request
    if (user.agentId) {
      notificationService.notifyNewWithdrawalRequest(user.agentId, {
        username: user.displayName || user.username,
        amount: data.amount,
      }).catch(err => logger.error('Failed to notify agent of withdrawal', err));
    }

    return withdrawal;
  }

  /**
   * Approve a withdrawal request — deducts balance from user
   */
  async approveWithdrawal(
    withdrawalId: string,
    processedBy: string,
    paymentData?: { paymentProof?: string; paymentTransactionId?: string; remarks?: string }
  ) {
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    });

    if (!withdrawal) throw new Error('Withdrawal request not found');
    if (withdrawal.status !== 'PENDING') throw new Error('Withdrawal is not in PENDING status');

    // Re-verify balance at approval time
    if (withdrawal.user.balance.toNumber() < withdrawal.amount.toNumber()) {
      throw new Error('User has insufficient balance for this withdrawal');
    }

    return prisma.$transaction(async (tx) => {
      const user = withdrawal.user;
      const balanceBefore = user.balance;
      const balanceAfter = balanceBefore.sub(withdrawal.amount);

      // Update withdrawal status
      const updated = await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'APPROVED',
          processedBy,
          processedAt: new Date(),
          paymentProof: paymentData?.paymentProof,
          paymentTransactionId: paymentData?.paymentTransactionId,
          remarks: paymentData?.remarks,
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: withdrawal.userId },
        data: {
          balance: balanceAfter,
          totalWithdrawn: { increment: withdrawal.amount },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          amount: withdrawal.amount,
          balanceBefore,
          balanceAfter,
          referenceId: withdrawalId,
          referenceType: 'WITHDRAWAL_REQUEST',
          processedBy,
          processedAt: new Date(),
          description: `Withdrawal via ${withdrawal.paymentMethod}`,
        },
      });

      logger.info(`Withdrawal ${withdrawalId} approved by ${processedBy}. User ${withdrawal.userId} balance: ${balanceBefore} → ${balanceAfter}`);

      // Real-time notifications
      emitWithdrawalStatus(withdrawal.userId, { withdrawalId, status: 'APPROVED', amount: withdrawal.amount.toString() });
      emitBalanceUpdate(withdrawal.userId, balanceAfter.toString(), 'Withdrawal approved');

      // Persist notification
      notificationService.notifyWithdrawalStatus(withdrawal.userId, {
        status: 'APPROVED',
        amount: withdrawal.amount.toNumber(),
      }).catch(err => logger.error('Failed to notify withdrawal status', err));

      return updated;
    });
  }

  /**
   * Reject a withdrawal request
   */
  async rejectWithdrawal(withdrawalId: string, processedBy: string, remarks: string) {
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) throw new Error('Withdrawal request not found');
    if (withdrawal.status !== 'PENDING') throw new Error('Withdrawal is not in PENDING status');

    const updated = await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        processedBy,
        processedAt: new Date(),
        remarks,
      },
    });

    // Notify user of rejection
    emitWithdrawalStatus(withdrawal.userId, { withdrawalId, status: 'REJECTED', amount: withdrawal.amount.toString() });
    notificationService.notifyWithdrawalStatus(withdrawal.userId, {
      status: 'REJECTED',
      amount: withdrawal.amount.toNumber(),
    }).catch(err => logger.error('Failed to notify withdrawal rejection', err));

    return updated;
  }

  /**
   * Get withdrawal requests with filters
   */
  async getWithdrawalRequests(filters: {
    userId?: string;
    status?: WithdrawalStatus;
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

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, displayName: true, balance: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      withdrawals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get withdrawal by ID
   */
  async getWithdrawalById(id: string) {
    return prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, balance: true, agentId: true } },
      },
    });
  }
}

export default new WithdrawalService();

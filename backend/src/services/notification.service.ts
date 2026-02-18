import prisma from '../db';
import logger from '../config/logger';
import { emitToUser, emitToAdmin } from '../utils/socketEmitter';

interface CreateNotificationData {
  userId?: string;
  agentId?: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  priority?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}

class NotificationService {
  /**
   * Create and persist a notification, then emit via Socket.io
   */
  async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId || null,
          agentId: data.agentId || null,
          title: data.title,
          message: data.message,
          type: data.type,
          category: data.category || 'SYSTEM',
          priority: data.priority || 'NORMAL',
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          metadata: data.metadata,
        },
      });

      // Emit real-time notification
      if (data.userId) {
        emitToUser(data.userId, 'notification:new', {
          id: notification.id,
          title: data.title,
          message: data.message,
          type: data.type,
          category: data.category,
          priority: data.priority,
          actionUrl: data.actionUrl,
          createdAt: notification.createdAt.toISOString(),
        });
      }
      if (data.agentId) {
        emitToAdmin(data.agentId, 'notification:new', {
          id: notification.id,
          title: data.title,
          message: data.message,
          type: data.type,
          category: data.category,
          priority: data.priority,
          actionUrl: data.actionUrl,
          createdAt: notification.createdAt.toISOString(),
        });
      }

      return notification;
    } catch (err) {
      logger.error('Failed to create notification', err);
      throw err;
    }
  }

  /**
   * Bulk create notifications (e.g., for broadcasting)
   */
  async createBulkNotifications(userIds: string[], data: Omit<CreateNotificationData, 'userId'>) {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category || 'SYSTEM',
        priority: data.priority || 'NORMAL',
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata,
      })),
    });

    // Emit to all users
    for (const userId of userIds) {
      emitToUser(userId, 'notification:new', {
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        priority: data.priority,
        createdAt: new Date().toISOString(),
      });
    }

    return notifications;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (params?.unreadOnly) where.read = false;
    if (params?.category) where.category = params.category;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get notifications for an agent
   */
  async getAgentNotifications(agentId: string, params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { agentId };
    if (params?.unreadOnly) where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { agentId, read: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read for an agent
   */
  async markAllAgentAsRead(agentId: string) {
    return prisma.notification.updateMany({
      where: { agentId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true,
      },
    });

    logger.info(`Cleaned up ${result.count} old notifications`);
    return result;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  /**
   * Get unread count for an agent
   */
  async getAgentUnreadCount(agentId: string): Promise<number> {
    return prisma.notification.count({ where: { agentId, read: false } });
  }

  // ============================================
  // HELPER METHODS FOR COMMON NOTIFICATIONS
  // ============================================

  async notifyBetSettled(userId: string, betData: {
    matchName: string;
    status: string;
    amount: number;
    winAmount?: number;
  }) {
    const isWin = betData.status === 'WON';
    return this.createNotification({
      userId,
      title: isWin ? 'Bet Won!' : 'Bet Lost',
      message: isWin
        ? `You won ₹${betData.winAmount} on ${betData.matchName}`
        : `Your bet of ₹${betData.amount} on ${betData.matchName} was lost`,
      type: 'BET_SETTLED',
      category: 'BETTING',
      priority: isWin ? 'HIGH' : 'NORMAL',
      actionUrl: '/bets',
      actionLabel: 'View Bets',
      metadata: betData,
    });
  }

  async notifyDepositStatus(userId: string, data: {
    status: string;
    amount: number;
  }) {
    const approved = data.status === 'APPROVED';
    return this.createNotification({
      userId,
      title: approved ? 'Deposit Approved' : 'Deposit Rejected',
      message: approved
        ? `Your deposit of ₹${data.amount} has been approved`
        : `Your deposit of ₹${data.amount} was rejected`,
      type: approved ? 'DEPOSIT_APPROVED' : 'DEPOSIT_REJECTED',
      category: 'FINANCE',
      priority: 'HIGH',
      actionUrl: '/deposit',
      actionLabel: 'View Deposits',
      metadata: data,
    });
  }

  async notifyWithdrawalStatus(userId: string, data: {
    status: string;
    amount: number;
  }) {
    const approved = data.status === 'APPROVED';
    return this.createNotification({
      userId,
      title: approved ? 'Withdrawal Approved' : 'Withdrawal Rejected',
      message: approved
        ? `Your withdrawal of ₹${data.amount} has been approved`
        : `Your withdrawal of ₹${data.amount} was rejected`,
      type: approved ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
      category: 'FINANCE',
      priority: 'HIGH',
      actionUrl: '/withdraw',
      actionLabel: 'View Withdrawals',
      metadata: data,
    });
  }

  async notifyMatchStarting(userId: string, matchName: string, matchId: string) {
    return this.createNotification({
      userId,
      title: 'Match Going Live!',
      message: `${matchName} is now LIVE. Place your bets!`,
      type: 'MATCH_STARTING',
      category: 'BETTING',
      priority: 'HIGH',
      actionUrl: `/matches/${matchId}`,
      actionLabel: 'View Match',
    });
  }

  async notifyNewDepositRequest(agentId: string, data: {
    username: string;
    amount: number;
  }) {
    return this.createNotification({
      agentId,
      title: 'New Deposit Request',
      message: `${data.username} requested a deposit of ₹${data.amount}`,
      type: 'DEPOSIT_REQUEST',
      category: 'FINANCE',
      priority: 'NORMAL',
      actionUrl: '/agent/transactions/deposits',
      actionLabel: 'Review',
      metadata: data,
    });
  }

  async notifyNewWithdrawalRequest(agentId: string, data: {
    username: string;
    amount: number;
  }) {
    return this.createNotification({
      agentId,
      title: 'New Withdrawal Request',
      message: `${data.username} requested a withdrawal of ₹${data.amount}`,
      type: 'WITHDRAWAL_REQUEST',
      category: 'FINANCE',
      priority: 'NORMAL',
      actionUrl: '/agent/transactions/withdrawals',
      actionLabel: 'Review',
      metadata: data,
    });
  }
}

export default new NotificationService();

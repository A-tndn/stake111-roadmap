import prisma from '../db';
import logger from '../config/logger';
import { emitToUser, emitToAdmin } from '../utils/socketEmitter';
import notificationService from './notification.service';

interface CreateTicketData {
  senderType: 'player' | 'agent';
  senderId: string;
  senderUsername: string;
  recipientType: 'agent' | 'master';
  recipientId: string;
  subject: string;
  message: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

class SupportService {
  /**
   * Create a new support ticket with initial message
   */
  async createTicket(data: CreateTicketData) {
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          senderType: data.senderType,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          recipientType: data.recipientType,
          recipientId: data.recipientId,
          subject: data.subject,
          priority: data.priority || 'NORMAL',
          messages: {
            create: {
              senderType: data.senderType,
              senderId: data.senderId,
              senderUsername: data.senderUsername,
              message: data.message,
            },
          },
        },
        include: {
          messages: true,
        },
      });

      // Notify recipient
      if (data.recipientType === 'agent') {
        emitToAdmin(data.recipientId, 'support:new-ticket', {
          ticketId: ticket.id,
          subject: data.subject,
          from: data.senderUsername,
          senderType: data.senderType,
          priority: data.priority || 'NORMAL',
        });
        await notificationService.createNotification({
          agentId: data.recipientId,
          title: 'New Support Query',
          message: `${data.senderUsername}: ${data.subject}`,
          type: 'SUPPORT_TICKET',
          category: 'SYSTEM',
          priority: data.priority || 'NORMAL',
          actionUrl: '/agent/support',
          actionLabel: 'View Ticket',
        });
      } else {
        // Master admin - broadcast to all admins
        // For master, we notify via a special user-level notification
        await notificationService.createNotification({
          agentId: data.recipientId,
          title: 'New Support Query from Agent',
          message: `${data.senderUsername}: ${data.subject}`,
          type: 'SUPPORT_TICKET',
          category: 'SYSTEM',
          priority: data.priority || 'NORMAL',
          actionUrl: '/master/support',
          actionLabel: 'View Ticket',
        });
        emitToAdmin(data.recipientId, 'support:new-ticket', {
          ticketId: ticket.id,
          subject: data.subject,
          from: data.senderUsername,
          senderType: data.senderType,
          priority: data.priority || 'NORMAL',
        });
      }

      return ticket;
    } catch (err) {
      logger.error('Failed to create support ticket', err);
      throw err;
    }
  }

  /**
   * Reply to a support ticket
   */
  async replyToTicket(ticketId: string, data: {
    senderType: string;
    senderId: string;
    senderUsername: string;
    message: string;
  }) {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Create message
      const msg = await prisma.supportMessage.create({
        data: {
          ticketId,
          senderType: data.senderType,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          message: data.message,
        },
      });

      // Update ticket status to IN_PROGRESS if currently OPEN
      if (ticket.status === 'OPEN') {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      // Notify the other party
      if (data.senderId !== ticket.senderId) {
        // Reply is from recipient (agent/master) -> notify the original sender
        if (ticket.senderType === 'player') {
          emitToUser(ticket.senderId, 'support:new-message', {
            ticketId,
            message: data.message,
            from: data.senderUsername,
          });
          await notificationService.createNotification({
            userId: ticket.senderId,
            title: 'Support Reply',
            message: `${data.senderUsername} replied to your query: ${ticket.subject}`,
            type: 'SUPPORT_REPLY',
            category: 'SYSTEM',
            priority: 'NORMAL',
            actionUrl: '/support',
            actionLabel: 'View Reply',
          });
        } else {
          emitToAdmin(ticket.senderId, 'support:new-message', {
            ticketId,
            message: data.message,
            from: data.senderUsername,
          });
          await notificationService.createNotification({
            agentId: ticket.senderId,
            title: 'Support Reply',
            message: `Master Admin replied to your query: ${ticket.subject}`,
            type: 'SUPPORT_REPLY',
            category: 'SYSTEM',
            priority: 'NORMAL',
            actionUrl: '/agent/support',
            actionLabel: 'View Reply',
          });
        }
      } else {
        // Reply is from original sender -> notify the recipient
        if (ticket.recipientType === 'agent') {
          emitToAdmin(ticket.recipientId, 'support:new-message', {
            ticketId,
            message: data.message,
            from: data.senderUsername,
          });
        } else {
          emitToAdmin(ticket.recipientId, 'support:new-message', {
            ticketId,
            message: data.message,
            from: data.senderUsername,
          });
        }
      }

      return msg;
    } catch (err) {
      logger.error('Failed to reply to ticket', err);
      throw err;
    }
  }

  /**
   * Get tickets for a player (sent tickets)
   */
  async getPlayerTickets(userId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      senderId: userId,
      senderType: 'player',
    };
    if (params?.status) where.status = params.status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: { where: { read: false, senderId: { not: userId } } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get tickets for an agent (received from players + sent to master)
   */
  async getAgentTickets(agentId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    direction?: 'received' | 'sent';
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    let where: any;
    if (params?.direction === 'sent') {
      where = { senderId: agentId, senderType: 'agent' };
    } else if (params?.direction === 'received') {
      where = { recipientId: agentId, recipientType: 'agent' };
    } else {
      where = {
        OR: [
          { recipientId: agentId, recipientType: 'agent' },
          { senderId: agentId, senderType: 'agent' },
        ],
      };
    }
    if (params?.status) where.status = params.status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: { where: { read: false, senderId: { not: agentId } } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get tickets for master admin (received from agents)
   */
  async getMasterTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { recipientType: 'master' };
    if (params?.status) where.status = params.status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single ticket with all messages
   */
  async getTicketById(ticketId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return ticket;
  }

  /**
   * Mark messages in a ticket as read for a user
   */
  async markMessagesRead(ticketId: string, readerId: string) {
    await prisma.supportMessage.updateMany({
      where: {
        ticketId,
        senderId: { not: readerId },
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Close/resolve a ticket
   */
  async updateTicketStatus(ticketId: string, status: 'RESOLVED' | 'CLOSED' | 'OPEN' | 'IN_PROGRESS', closedBy?: string) {
    const data: any = { status };
    if (status === 'RESOLVED' || status === 'CLOSED') {
      data.closedAt = new Date();
      data.closedBy = closedBy;
    }
    if (status === 'OPEN' || status === 'IN_PROGRESS') {
      data.closedAt = null;
      data.closedBy = null;
    }

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });
  }

  /**
   * Get unread ticket count for a user
   */
  async getUnreadCount(userId: string, userType: 'player' | 'agent' | 'master') {
    if (userType === 'player') {
      const tickets = await prisma.supportTicket.findMany({
        where: { senderId: userId, senderType: 'player' },
        select: { id: true },
      });
      if (tickets.length === 0) return 0;
      return prisma.supportMessage.count({
        where: {
          ticketId: { in: tickets.map(t => t.id) },
          senderId: { not: userId },
          read: false,
        },
      });
    } else if (userType === 'agent') {
      // Agent: count unread from received + sent tickets
      const tickets = await prisma.supportTicket.findMany({
        where: {
          OR: [
            { recipientId: userId, recipientType: 'agent' },
            { senderId: userId, senderType: 'agent' },
          ],
        },
        select: { id: true },
      });
      if (tickets.length === 0) return 0;
      return prisma.supportMessage.count({
        where: {
          ticketId: { in: tickets.map(t => t.id) },
          senderId: { not: userId },
          read: false,
        },
      });
    } else {
      // Master: count all unread from agent tickets
      const tickets = await prisma.supportTicket.findMany({
        where: { recipientType: 'master' },
        select: { id: true },
      });
      if (tickets.length === 0) return 0;
      return prisma.supportMessage.count({
        where: {
          ticketId: { in: tickets.map(t => t.id) },
          senderType: { not: 'master' },
          read: false,
        },
      });
    }
  }
}

export default new SupportService();

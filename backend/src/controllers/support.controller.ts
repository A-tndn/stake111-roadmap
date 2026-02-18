import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import supportService from '../services/support.service';
import prisma from '../db';

// ============================================
// PLAYER SUPPORT ENDPOINTS
// ============================================

/**
 * Player creates a new support ticket (sends to their agent)
 */
export const playerCreateTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { subject, message, priority } = req.body;

  // Get the player's agent
  const player = await prisma.user.findUnique({
    where: { id: userId },
    select: { agentId: true, username: true },
  });

  if (!player?.agentId) {
    return errorResponse(res, 'You are not assigned to an agent', 400);
  }

  const ticket = await supportService.createTicket({
    senderType: 'player',
    senderId: userId,
    senderUsername: player.username,
    recipientType: 'agent',
    recipientId: player.agentId,
    subject,
    message,
    priority,
  });

  successResponse(res, 'Support ticket created successfully', ticket, 201);
});

/**
 * Player gets their tickets
 */
export const playerGetTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { page, limit, status } = req.query;

  const result = await supportService.getPlayerTickets(userId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    status: status as string,
  });

  successResponse(res, 'Tickets retrieved', result);
});

/**
 * Player gets a specific ticket with messages
 */
export const playerGetTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const ticket = await supportService.getTicketById(id);

  if (!ticket || ticket.senderId !== userId) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  // Mark messages as read
  await supportService.markMessagesRead(id, userId);

  successResponse(res, 'Ticket retrieved', ticket);
});

/**
 * Player replies to a ticket
 */
export const playerReplyTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { message } = req.body;

  // Verify player owns the ticket
  const ticket = await supportService.getTicketById(id);
  if (!ticket || ticket.senderId !== userId) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  if (ticket.status === 'CLOSED') {
    return errorResponse(res, 'Ticket is closed', 400);
  }

  const player = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  const msg = await supportService.replyToTicket(id, {
    senderType: 'player',
    senderId: userId,
    senderUsername: player!.username,
    message,
  });

  successResponse(res, 'Reply sent', msg, 201);
});

/**
 * Player gets unread count
 */
export const playerUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const count = await supportService.getUnreadCount(userId, 'player');
  successResponse(res, 'Unread count', { count });
});

// ============================================
// AGENT SUPPORT ENDPOINTS
// ============================================

/**
 * Agent creates a ticket to master admin
 */
export const agentCreateTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { subject, message, priority } = req.body;

  // Get agent info
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { username: true, parentAgentId: true },
  });

  if (!agent) {
    return errorResponse(res, 'Agent not found', 404);
  }

  // Find master admin user (userRole MASTER_ADMIN)
  const masterAdmin = await prisma.user.findFirst({
    where: { role: 'MASTER_ADMIN' },
    select: { id: true },
  });

  // Recipient is the parent agent or master admin
  const recipientId = masterAdmin?.id || 'master';

  const ticket = await supportService.createTicket({
    senderType: 'agent',
    senderId: agentId,
    senderUsername: agent.username,
    recipientType: 'master',
    recipientId,
    subject,
    message,
    priority,
  });

  successResponse(res, 'Support ticket created', ticket, 201);
});

/**
 * Agent gets all their tickets (received + sent)
 */
export const agentGetTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { page, limit, status, direction } = req.query;

  const result = await supportService.getAgentTickets(agentId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    status: status as string,
    direction: direction as 'received' | 'sent',
  });

  successResponse(res, 'Agent tickets retrieved', result);
});

/**
 * Agent gets a specific ticket
 */
export const agentGetTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { id } = req.params;

  const ticket = await supportService.getTicketById(id);

  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  // Agent must be sender or recipient
  if (ticket.senderId !== agentId && ticket.recipientId !== agentId) {
    return errorResponse(res, 'Unauthorized', 403);
  }

  // Mark messages as read
  await supportService.markMessagesRead(id, agentId);

  successResponse(res, 'Ticket retrieved', ticket);
});

/**
 * Agent replies to a ticket
 */
export const agentReplyTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { id } = req.params;
  const { message } = req.body;

  const ticket = await supportService.getTicketById(id);
  if (!ticket) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  if (ticket.senderId !== agentId && ticket.recipientId !== agentId) {
    return errorResponse(res, 'Unauthorized', 403);
  }

  if (ticket.status === 'CLOSED') {
    return errorResponse(res, 'Ticket is closed', 400);
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { username: true },
  });

  const msg = await supportService.replyToTicket(id, {
    senderType: 'agent',
    senderId: agentId,
    senderUsername: agent!.username,
    message,
  });

  successResponse(res, 'Reply sent', msg, 201);
});

/**
 * Agent updates ticket status
 */
export const agentUpdateTicketStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { id } = req.params;
  const { status } = req.body;

  const ticket = await supportService.getTicketById(id);
  if (!ticket || ticket.recipientId !== agentId) {
    return errorResponse(res, 'Ticket not found', 404);
  }

  const updated = await supportService.updateTicketStatus(id, status, agentId);
  successResponse(res, 'Ticket status updated', updated);
});

/**
 * Agent gets unread count
 */
export const agentUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const count = await supportService.getUnreadCount(agentId, 'agent');
  successResponse(res, 'Unread count', { count });
});

// ============================================
// MASTER ADMIN SUPPORT ENDPOINTS
// ============================================

/**
 * Master gets all tickets sent by agents
 */
export const masterGetTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, status } = req.query;

  const result = await supportService.getMasterTickets({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    status: status as string,
  });

  successResponse(res, 'Master tickets retrieved', result);
});

/**
 * Master gets a specific ticket
 */
export const masterGetTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const ticket = await supportService.getTicketById(id);

  if (!ticket || ticket.recipientType !== 'master') {
    return errorResponse(res, 'Ticket not found', 404);
  }

  // Mark messages as read
  await supportService.markMessagesRead(id, userId);

  successResponse(res, 'Ticket retrieved', ticket);
});

/**
 * Master replies to a ticket
 */
export const masterReplyTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { message } = req.body;

  const ticket = await supportService.getTicketById(id);
  if (!ticket || ticket.recipientType !== 'master') {
    return errorResponse(res, 'Ticket not found', 404);
  }

  if (ticket.status === 'CLOSED') {
    return errorResponse(res, 'Ticket is closed', 400);
  }

  const msg = await supportService.replyToTicket(id, {
    senderType: 'master',
    senderId: userId,
    senderUsername: 'Master Admin',
    message,
  });

  successResponse(res, 'Reply sent', msg, 201);
});

/**
 * Master updates ticket status
 */
export const masterUpdateTicketStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { status } = req.body;

  const ticket = await supportService.getTicketById(id);
  if (!ticket || ticket.recipientType !== 'master') {
    return errorResponse(res, 'Ticket not found', 404);
  }

  const updated = await supportService.updateTicketStatus(id, status, userId);
  successResponse(res, 'Ticket status updated', updated);
});

/**
 * Master gets unread count
 */
export const masterUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await supportService.getUnreadCount('', 'master');
  successResponse(res, 'Unread count', { count });
});

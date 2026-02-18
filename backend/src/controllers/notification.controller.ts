import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import notificationService from '../services/notification.service';

// ============================================
// USER NOTIFICATION ENDPOINTS
// ============================================

export const getUserNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { page, limit, unreadOnly, category } = req.query;
  const result = await notificationService.getUserNotifications(userId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    unreadOnly: unreadOnly === 'true',
    category: category as string,
  });
  successResponse(res, 'Notifications retrieved successfully', result);
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const count = await notificationService.getUnreadCount(userId);
  successResponse(res, 'Unread count retrieved', { count });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const notification = await notificationService.markAsRead(id);
  successResponse(res, 'Notification marked as read', notification);
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  await notificationService.markAllAsRead(userId);
  successResponse(res, 'All notifications marked as read');
});

// ============================================
// AGENT NOTIFICATION ENDPOINTS
// ============================================

export const getAgentNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { page, limit, unreadOnly } = req.query;
  const result = await notificationService.getAgentNotifications(agentId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    unreadOnly: unreadOnly === 'true',
  });
  successResponse(res, 'Agent notifications retrieved successfully', result);
});

export const getAgentUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const count = await notificationService.getAgentUnreadCount(agentId);
  successResponse(res, 'Agent unread count retrieved', { count });
});

export const markAllAgentAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  await notificationService.markAllAgentAsRead(agentId);
  successResponse(res, 'All agent notifications marked as read');
});

// ============================================
// ADMIN BROADCAST (Agent/Master Admin)
// ============================================

export const broadcastNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userIds, title, message, type, category, priority, actionUrl, actionLabel } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return errorResponse(res, 'userIds array is required', 400);
  }

  const result = await notificationService.createBulkNotifications(userIds, {
    title,
    message,
    type: type || 'SYSTEM',
    category: category || 'SYSTEM',
    priority: priority || 'NORMAL',
    actionUrl,
    actionLabel,
  });

  successResponse(res, `Broadcast sent to ${userIds.length} users`, result, 201);
});

export const createAdminNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notification = await notificationService.createNotification(req.body);
  successResponse(res, 'Notification created successfully', notification, 201);
});

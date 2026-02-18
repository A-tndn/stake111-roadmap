import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate, agentOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

router.use(authenticate);

// Validation schemas
const broadcastSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  type: Joi.string().optional(),
  category: Joi.string().optional(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional(),
  actionUrl: Joi.string().optional(),
  actionLabel: Joi.string().optional(),
});

const createNotificationSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  agentId: Joi.string().uuid().optional(),
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  type: Joi.string().required(),
  category: Joi.string().optional(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional(),
  actionUrl: Joi.string().optional(),
  actionLabel: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

// ============================================
// USER NOTIFICATION ROUTES
// ============================================

// Get user's notifications (paginated)
router.get('/', notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// Mark single notification as read
router.put('/:id/read', notificationController.markAsRead);

// ============================================
// AGENT NOTIFICATION ROUTES
// ============================================

// Get agent-specific notifications
router.get('/agent', agentOnly, notificationController.getAgentNotifications);

// Get agent unread count
router.get('/agent/unread-count', agentOnly, notificationController.getAgentUnreadCount);

// Mark all agent notifications as read
router.put('/agent/read-all', agentOnly, notificationController.markAllAgentAsRead);

// ============================================
// ADMIN BROADCAST ROUTES
// ============================================

// Broadcast notification to multiple users
router.post('/broadcast', agentOnly, validate(broadcastSchema), notificationController.broadcastNotification);

// Create a single notification (admin use)
router.post('/', agentOnly, validate(createNotificationSchema), notificationController.createAdminNotification);

export default router;

import { Router } from 'express';
import * as supportController from '../controllers/support.controller';
import { authenticate, agentOnly, masterAdminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

router.use(authenticate);

// Validation schemas
const createTicketSchema = Joi.object({
  subject: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(1).max(2000).required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional(),
});

const replySchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
});

const statusSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').required(),
});

// ============================================
// PLAYER ROUTES
// ============================================

router.post('/player/tickets', validate(createTicketSchema), supportController.playerCreateTicket);
router.get('/player/tickets', supportController.playerGetTickets);
router.get('/player/tickets/:id', supportController.playerGetTicket);
router.post('/player/tickets/:id/reply', validate(replySchema), supportController.playerReplyTicket);
router.get('/player/unread-count', supportController.playerUnreadCount);

// ============================================
// AGENT ROUTES
// ============================================

router.post('/agent/tickets', agentOnly, validate(createTicketSchema), supportController.agentCreateTicket);
router.get('/agent/tickets', agentOnly, supportController.agentGetTickets);
router.get('/agent/tickets/:id', agentOnly, supportController.agentGetTicket);
router.post('/agent/tickets/:id/reply', agentOnly, validate(replySchema), supportController.agentReplyTicket);
router.put('/agent/tickets/:id/status', agentOnly, validate(statusSchema), supportController.agentUpdateTicketStatus);
router.get('/agent/unread-count', agentOnly, supportController.agentUnreadCount);

// ============================================
// MASTER ADMIN ROUTES
// ============================================

router.get('/master/tickets', masterAdminOnly, supportController.masterGetTickets);
router.get('/master/tickets/:id', masterAdminOnly, supportController.masterGetTicket);
router.post('/master/tickets/:id/reply', masterAdminOnly, validate(replySchema), supportController.masterReplyTicket);
router.put('/master/tickets/:id/status', masterAdminOnly, validate(statusSchema), supportController.masterUpdateTicketStatus);
router.get('/master/unread-count', masterAdminOnly, supportController.masterUnreadCount);

export default router;

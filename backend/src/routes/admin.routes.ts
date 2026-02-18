import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, agentOnly, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

// All admin routes require authentication + agent role
router.use(authenticate);
router.use(agentOnly);

// ============================================
// VALIDATION SCHEMAS
// ============================================

const updateClientSchema = Joi.object({
  displayName: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  creditLimit: Joi.number().min(0).optional(),
  sportSharePercent: Joi.number().min(0).max(100).optional(),
  accountType: Joi.string().valid('STANDARD', 'NOC', 'PREMIUM', 'VIP').optional(),
  matchLimit: Joi.number().min(0).optional(),
  sessionLimit: Joi.number().min(0).optional(),
  minBet: Joi.number().min(1).optional(),
  maxBet: Joi.number().min(1).optional(),
}).min(1);

const bulkUpdateSchema = Joi.object({
  clientIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  creditLimit: Joi.number().min(0).optional(),
  matchLimit: Joi.number().min(0).optional(),
  sessionLimit: Joi.number().min(0).optional(),
  minBet: Joi.number().min(1).optional(),
  maxBet: Joi.number().min(1).optional(),
}).min(2); // at least clientIds + one limit field

const updateOddsSchema = Joi.object({
  team1BackOdds: Joi.number().min(1).optional(),
  team1LayOdds: Joi.number().min(1).optional(),
  team2BackOdds: Joi.number().min(1).optional(),
  team2LayOdds: Joi.number().min(1).optional(),
  drawBackOdds: Joi.number().min(1).optional(),
  drawLayOdds: Joi.number().min(1).optional(),
}).min(1);

// ============================================
// DASHBOARD
// ============================================

router.get('/dashboard/stats', adminController.getDashboardStats);

// ============================================
// CLIENT MANAGEMENT
// ============================================

router.get('/clients', requirePermission('CAN_CREATE_CLIENTS'), adminController.getClients);
router.get('/clients/:id', requirePermission('CAN_CREATE_CLIENTS'), adminController.getClientById);
router.put('/clients/:id', requirePermission('CAN_CREATE_CLIENTS'), validate(updateClientSchema), adminController.updateClient);
router.put('/clients/:id/toggle-lock', requirePermission('CAN_CREATE_CLIENTS'), adminController.toggleClientLock);
router.put('/clients/:id/toggle-bet-lock', requirePermission('CAN_CREATE_CLIENTS'), adminController.toggleClientBetLock);
router.post('/clients/bulk-update-limits', requirePermission('CAN_CREATE_CLIENTS'), validate(bulkUpdateSchema), adminController.bulkUpdateLimits);
router.get('/clients/:id/reports', requirePermission('CAN_VIEW_REPORTS'), adminController.getClientReport);

// ============================================
// MATCH MANAGEMENT
// ============================================

router.get('/matches/current', requirePermission('CAN_MANAGE_MATCHES'), adminController.getCurrentMatches);
router.get('/matches/completed', requirePermission('CAN_MANAGE_MATCHES'), adminController.getCompletedMatches);
router.put('/matches/:id/odds', requirePermission('CAN_MANAGE_ODDS'), validate(updateOddsSchema), adminController.updateMatchOdds);
router.put('/matches/:id/toggle-betting', requirePermission('CAN_MANAGE_MATCHES'), adminController.toggleMatchBetting);
router.get('/matches/:id/bets', requirePermission('CAN_MANAGE_MATCHES'), adminController.getMatchBets);

// ============================================
// REPORTS
// ============================================

router.get('/reports', requirePermission('CAN_VIEW_REPORTS'), adminController.getMyReports);

// ============================================
// LEDGER
// ============================================

router.get('/ledger/user/:userId', adminController.getUserLedger);

export default router;

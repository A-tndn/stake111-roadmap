import { Router } from 'express';
import * as masterController from '../controllers/master.controller';
import { authenticate, masterAdminOnly, logAdminAction } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

// All master routes require authentication + master admin role
router.use(authenticate);
router.use(masterAdminOnly);

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createAdminSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  password: Joi.string().min(6).max(100).required(),
  displayName: Joi.string().min(2).max(100).required(),
  agentType: Joi.string().valid('SUPER_MASTER', 'MASTER', 'AGENT').required(),
  parentAgentId: Joi.string().uuid().optional(),
  commissionRate: Joi.number().min(0).max(50).optional(),
  creditLimit: Joi.number().min(0).optional(),
  permissions: Joi.array().items(
    Joi.string().valid(
      'CAN_CREATE_CLIENTS', 'CAN_MANAGE_DEPOSITS', 'CAN_MANAGE_WITHDRAWALS',
      'CAN_VIEW_REPORTS', 'CAN_MANAGE_MATCHES', 'CAN_SETTLE_BETS',
      'CAN_ACCESS_CASINO', 'CAN_CREATE_SUB_AGENTS', 'CAN_MANAGE_ODDS',
      'CAN_VIEW_AUDIT_LOGS'
    )
  ).optional(),
  maxPlayersAllowed: Joi.number().min(1).optional(),
  sportSharePercent: Joi.number().min(0).max(100).optional(),
});

const generateSettlementSchema = Joi.object({
  agentId: Joi.string().uuid().required(),
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().required(),
});

const generateAllSettlementsSchema = Joi.object({
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().required(),
});

const paySettlementSchema = Joi.object({
  paymentMethod: Joi.string().required(),
  paymentProof: Joi.string().optional(),
  paymentTransactionId: Joi.string().optional(),
  remarks: Joi.string().optional(),
});

const updateSettingsSchema = Joi.object({
  platformName: Joi.string().optional(),
  platformLogo: Joi.string().optional(),
  welcomeBanner: Joi.string().allow('').optional(),
  maintenanceMode: Joi.boolean().optional(),
  registrationOpen: Joi.boolean().optional(),
  globalMinBet: Joi.number().min(1).optional(),
  globalMaxBet: Joi.number().min(1).optional(),
  globalMaxPayout: Joi.number().min(1).optional(),
  commissionStructure: Joi.object().optional(),
  autoSettlementEnabled: Joi.boolean().optional(),
  settlementFrequency: Joi.string().valid('WEEKLY', 'MONTHLY').optional(),
  settlementDay: Joi.number().min(0).max(28).optional(),
  casinoEnabled: Joi.boolean().optional(),
  liveBettingEnabled: Joi.boolean().optional(),
  depositEnabled: Joi.boolean().optional(),
  withdrawalEnabled: Joi.boolean().optional(),
  maxLoginAttempts: Joi.number().min(1).optional(),
  lockoutDuration: Joi.number().min(1).optional(),
  sessionTimeout: Joi.number().min(1).optional(),
  twoFactorRequired: Joi.boolean().optional(),
}).min(1);

// ============================================
// ADMIN/AGENT MANAGEMENT
// ============================================

router.get('/admins', masterController.getAllAdmins);
router.get('/admins/hierarchy', masterController.getAdminHierarchy);
router.get('/admins/:id', masterController.getAdminById);
router.post('/admins', validate(createAdminSchema), masterController.createAdmin);
router.put('/admins/:id', masterController.updateAdmin);
router.delete('/admins/:id', masterController.deleteAdmin);
router.put('/admins/:id/toggle-lock', masterController.toggleAdminLock);
router.put('/admins/:id/toggle-bet-lock', masterController.toggleAdminBetLock);
router.post('/admins/:id/reset-password', masterController.resetAdminPassword);
router.put('/admins/:id/permissions', masterController.updateAdminPermissions);
router.get('/admins/:id/clients', masterController.getAdminClients);

// ============================================
// SETTLEMENTS
// ============================================

router.get('/settlements', masterController.getSettlements);
router.get('/settlements/:id', masterController.getSettlementById);
router.post('/settlements/generate', validate(generateSettlementSchema), masterController.generateSettlement);
router.post('/settlements/generate-all', validate(generateAllSettlementsSchema), masterController.generateAllSettlements);
router.put('/settlements/:id/approve', masterController.approveSettlement);
router.put('/settlements/:id/pay', validate(paySettlementSchema), masterController.paySettlement);
router.put('/settlements/:id/reject', masterController.rejectSettlement);

// ============================================
// SYSTEM SETTINGS
// ============================================

router.get('/settings', masterController.getSettings);
router.put('/settings', validate(updateSettingsSchema), masterController.updateSettings);
router.put('/settings/commission', masterController.updateCommissionStructure);
router.put('/settings/betting-limits', masterController.updateBettingLimits);
router.post('/settings/maintenance-mode', masterController.toggleMaintenanceMode);

// ============================================
// DASHBOARD & REPORTS
// ============================================

router.get('/dashboard/stats', masterController.getDashboardStats);
router.get('/reports/financial', masterController.getFinancialReport);
router.get('/reports/users', masterController.getUserReport);
router.get('/reports/matches', masterController.getMatchReport);
router.get('/reports/agents', masterController.getAgentReport);

// ============================================
// GLOBAL TRANSACTIONS
// ============================================

router.get('/transactions', masterController.getAllTransactions);

// ============================================
// AUDIT LOGS
// ============================================

router.get('/audit-logs', masterController.getAuditLogs);

export default router;

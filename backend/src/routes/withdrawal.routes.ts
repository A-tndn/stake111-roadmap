import { Router } from 'express';
import * as withdrawalController from '../controllers/withdrawal.controller';
import { authenticate, agentOnly, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { financialLimiter } from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();

router.use(authenticate);

// Validation schemas
const createWithdrawalSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  paymentMethod: Joi.string().valid('UPI', 'BANK_TRANSFER', 'CASH', 'PAYTM', 'PHONEPE', 'GPAY').required(),
  bankName: Joi.string().optional(),
  accountNumber: Joi.string().optional(),
  ifscCode: Joi.string().optional(),
  accountHolderName: Joi.string().optional(),
  upiId: Joi.string().optional(),
});

// ============================================
// USER ROUTES
// ============================================

router.post('/', financialLimiter, validate(createWithdrawalSchema), withdrawalController.createWithdrawal);
router.get('/my', withdrawalController.getMyWithdrawals);

// ============================================
// ADMIN ROUTES
// ============================================

router.get('/all', agentOnly, requirePermission('CAN_MANAGE_WITHDRAWALS'), withdrawalController.getAllWithdrawals);
router.get('/:id', withdrawalController.getWithdrawalById);
router.put('/:id/approve', agentOnly, requirePermission('CAN_MANAGE_WITHDRAWALS'), withdrawalController.approveWithdrawal);
router.put('/:id/reject', agentOnly, requirePermission('CAN_MANAGE_WITHDRAWALS'), withdrawalController.rejectWithdrawal);

export default router;

import { Router } from 'express';
import * as depositController from '../controllers/deposit.controller';
import { authenticate, agentOnly, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { financialLimiter } from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();

router.use(authenticate);

// Validation schemas
const createDepositSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  paymentMethod: Joi.string().valid('UPI', 'BANK_TRANSFER', 'CASH', 'PAYTM', 'PHONEPE', 'GPAY').required(),
  paymentProof: Joi.string().uri().optional(),
  transactionRef: Joi.string().optional(),
});

// ============================================
// USER ROUTES
// ============================================

router.post('/', financialLimiter, validate(createDepositSchema), depositController.createDeposit);
router.get('/my', depositController.getMyDeposits);

// ============================================
// ADMIN ROUTES
// ============================================

router.get('/all', agentOnly, requirePermission('CAN_MANAGE_DEPOSITS'), depositController.getAllDeposits);
router.get('/:id', depositController.getDepositById);
router.put('/:id/approve', agentOnly, requirePermission('CAN_MANAGE_DEPOSITS'), depositController.approveDeposit);
router.put('/:id/reject', agentOnly, requirePermission('CAN_MANAGE_DEPOSITS'), depositController.rejectDeposit);

export default router;

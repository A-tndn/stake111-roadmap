import { Router } from 'express';
import * as matchController from '../controllers/match.controller';
import { authenticate, authorize, agentOnly, requirePermission, logAdminAction } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

// Validation schemas
const settleMatchSchema = Joi.object({
  winner: Joi.string().required(),
  topBatsman: Joi.string().optional(),
  topBowler: Joi.string().optional(),
  totalRuns: Joi.number().optional(),
  totalWickets: Joi.number().optional(),
});

const voidMatchSchema = Joi.object({
  reason: Joi.string().min(3).max(500).optional(),
});

// Public routes
router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);

// Admin: sync matches from external API
router.post(
  '/sync',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'),
  logAdminAction('sync_matches', 'match'),
  matchController.syncMatches
);

// Admin: update scores from external API
router.post(
  '/update-scores',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN'),
  logAdminAction('update_scores', 'match'),
  matchController.updateScores
);

// Admin/Agent: settle a match (determine winners, pay out bets)
router.put(
  '/:id/settle',
  authenticate,
  agentOnly,
  requirePermission('CAN_SETTLE_BETS'),
  validate(settleMatchSchema),
  logAdminAction('settle_match', 'match'),
  matchController.settleMatch
);

// Admin/Agent: void a match (cancel all bets, refund users)
router.put(
  '/:id/void',
  authenticate,
  agentOnly,
  requirePermission('CAN_SETTLE_BETS'),
  validate(voidMatchSchema),
  logAdminAction('void_match', 'match'),
  matchController.voidMatch
);

// Admin/Agent: get settlement summary for a match
router.get(
  '/:id/settlement',
  authenticate,
  agentOnly,
  requirePermission('CAN_VIEW_REPORTS'),
  matchController.getMatchSettlement
);

export default router;

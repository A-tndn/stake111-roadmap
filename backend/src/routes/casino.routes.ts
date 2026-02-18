import { Router } from 'express';
import * as casinoController from '../controllers/casino.controller';
import { authenticate, agentOnly, requirePermission, checkBetLock } from '../middleware/auth';
import { validate } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

router.use(authenticate);

// Validation schemas
const createGameSchema = Joi.object({
  gameName: Joi.string().min(2).max(100).required(),
  gameType: Joi.string().valid(
    'TEEN_PATTI', 'INDIAN_POKER', 'HI_LO', 'COIN_FLIP',
    'DICE_ROLL', 'ROULETTE', 'ANDAR_BAHAR'
  ).required(),
  description: Joi.string().optional(),
  rules: Joi.string().optional(),
  image: Joi.string().uri().optional(),
  minBet: Joi.number().min(1).optional(),
  maxBet: Joi.number().min(1).optional(),
  rtp: Joi.number().min(80).max(99.99).optional(),
});

const updateGameSchema = Joi.object({
  gameName: Joi.string().min(2).max(100).optional(),
  description: Joi.string().optional(),
  rules: Joi.string().optional(),
  image: Joi.string().uri().optional(),
  minBet: Joi.number().min(1).optional(),
  maxBet: Joi.number().min(1).optional(),
  rtp: Joi.number().min(80).max(99.99).optional(),
  enabled: Joi.boolean().optional(),
  sortOrder: Joi.number().optional(),
}).min(1);

const placeBetSchema = Joi.object({
  roundId: Joi.string().uuid().required(),
  betType: Joi.string().required(),
  betData: Joi.object().optional(),
  amount: Joi.number().min(1).required(),
});

// ============================================
// PUBLIC GAME LISTING
// ============================================

// Get all enabled games
router.get('/games', casinoController.getGames);
router.get('/games/:id', casinoController.getGameById);

// ============================================
// PLAYER ROUTES
// ============================================

// Place a bet (manual round mode)
router.post('/bets', checkBetLock, validate(placeBetSchema), casinoController.placeBet);

// Instant play — bet + result + settle in one call (for instant games)
const instantPlaySchema = Joi.object({
  gameId: Joi.string().uuid().required(),
  betType: Joi.string().required(),
  betData: Joi.object().optional(),
  amount: Joi.number().min(1).required(),
  clientSeed: Joi.string().optional(),
});
router.post('/play', checkBetLock, validate(instantPlaySchema), casinoController.instantPlay);

// Get bet history
router.get('/bets/history', casinoController.getBetHistory);

// ============================================
// ADMIN ROUTES (game management)
// ============================================

router.post('/games', agentOnly, requirePermission('CAN_ACCESS_CASINO'), validate(createGameSchema), casinoController.createGame);
router.put('/games/:id', agentOnly, requirePermission('CAN_ACCESS_CASINO'), validate(updateGameSchema), casinoController.updateGame);
router.put('/games/:id/toggle', agentOnly, requirePermission('CAN_ACCESS_CASINO'), casinoController.toggleGame);
router.delete('/games/:id', agentOnly, requirePermission('CAN_ACCESS_CASINO'), casinoController.deleteGame);

// Round management
router.post('/rounds', agentOnly, requirePermission('CAN_ACCESS_CASINO'), casinoController.createRound);
router.put('/rounds/:id/close', agentOnly, requirePermission('CAN_ACCESS_CASINO'), casinoController.closeRound);
router.put('/rounds/:id/settle', agentOnly, requirePermission('CAN_ACCESS_CASINO'), casinoController.settleRound);

export default router;

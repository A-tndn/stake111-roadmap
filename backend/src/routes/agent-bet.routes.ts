import { Router } from 'express';
import Joi from 'joi';
import * as agentBetController from '../controllers/agent-bet.controller';
import { authenticate, agentOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication + agent role
router.use(authenticate);
router.use(agentOnly);

// ============================================
// VALIDATION SCHEMAS
// ============================================

const placeBetSchema = Joi.object({
  matchId: Joi.string().uuid().required().messages({
    'string.guid': 'matchId must be a valid UUID',
    'any.required': 'matchId is required',
  }),
  betType: Joi.string()
    .valid(
      'MATCH_WINNER',
      'TOP_BATSMAN',
      'TOP_BOWLER',
      'TOTAL_RUNS',
      'TOTAL_WICKETS',
      'PLAYER_PERFORMANCE',
      'SESSION',
      'FANCY',
      'OVER_UNDER',
      'PARLAY'
    )
    .required()
    .messages({
      'any.only': 'betType must be one of: MATCH_WINNER, TOP_BATSMAN, TOP_BOWLER, TOTAL_RUNS, TOTAL_WICKETS, PLAYER_PERFORMANCE, SESSION, FANCY, OVER_UNDER, PARLAY',
      'any.required': 'betType is required',
    }),
  betOn: Joi.string().min(1).max(200).required().messages({
    'string.min': 'betOn must not be empty',
    'any.required': 'betOn is required',
  }),
  amount: Joi.number().min(10).max(1000000).required().messages({
    'number.min': 'Minimum bet amount is 10',
    'number.max': 'Maximum bet amount is 1,000,000',
    'any.required': 'amount is required',
  }),
  odds: Joi.number().min(1.01).max(1000).required().messages({
    'number.min': 'Odds must be at least 1.01',
    'number.max': 'Odds must not exceed 1000',
    'any.required': 'odds is required',
  }),
  description: Joi.string().max(500).optional().allow('', null),
  isBack: Joi.boolean().optional().default(true),
});

const placeFancyBetSchema = Joi.object({
  matchId: Joi.string().uuid().required().messages({
    'string.guid': 'matchId must be a valid UUID',
    'any.required': 'matchId is required',
  }),
  fancyMarketId: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'fancyMarketId must be a valid UUID',
  }),
  betOn: Joi.string().valid('YES', 'NO').required().messages({
    'any.only': 'betOn must be YES or NO',
    'any.required': 'betOn is required',
  }),
  amount: Joi.number().min(10).max(1000000).required().messages({
    'number.min': 'Minimum bet amount is 10',
    'number.max': 'Maximum bet amount is 1,000,000',
    'any.required': 'amount is required',
  }),
  odds: Joi.number().min(1).max(10000).required().messages({
    'number.min': 'Odds must be at least 1',
    'number.max': 'Odds must not exceed 10000',
    'any.required': 'odds is required',
  }),
  runValue: Joi.number().min(0).max(10000).required().messages({
    'number.min': 'runValue must be non-negative',
    'any.required': 'runValue is required',
  }),
  description: Joi.string().max(500).optional().allow('', null),
  isBack: Joi.boolean().optional().default(true),
});

// ============================================
// ROUTES
// ============================================

// Standard bet placement
router.post('/bets/place', validate(placeBetSchema), agentBetController.placeAgentBet);

// Fancy bet placement
router.post('/fancy-bets/place', validate(placeFancyBetSchema), agentBetController.placeAgentFancyBet);

// Agent's full bet history (filterable by matchId, status, limit)
router.get('/bets/my-bets', agentBetController.getAgentBets);

// Agent's bets for a specific match
router.get('/bets/match/:matchId', agentBetController.getAgentBetsByMatch);

export default router;

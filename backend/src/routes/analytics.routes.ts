import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate, agentOnly, masterAdminOnly } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// ============================================
// PLATFORM STATS (Master Admin only)
// ============================================

router.get('/platform', masterAdminOnly, analyticsController.getPlatformStats);

// ============================================
// DAILY SUMMARY (Available to agents + master)
// ============================================

router.get('/today', agentOnly, analyticsController.getTodaySummary);

// ============================================
// REVENUE (Agent: own downline, Master: all)
// ============================================

router.get('/revenue', agentOnly, analyticsController.getRevenueData);

// ============================================
// USER ANALYTICS (Agent: own, Master: all)
// ============================================

router.get('/users/growth', agentOnly, analyticsController.getUserGrowth);
router.get('/users/top-bettors', agentOnly, analyticsController.getTopBettors);

// ============================================
// MATCH ANALYTICS
// ============================================

router.get('/matches/pnl', agentOnly, analyticsController.getMatchPnL);

// ============================================
// AGENT ANALYTICS (Master Admin only)
// ============================================

router.get('/agents/performance', masterAdminOnly, analyticsController.getAgentPerformance);

// ============================================
// CASINO ANALYTICS (Master Admin only)
// ============================================

router.get('/casino', masterAdminOnly, analyticsController.getCasinoAnalytics);

export default router;

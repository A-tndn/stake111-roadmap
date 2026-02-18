import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import analyticsService from '../services/analytics.service';

// ============================================
// PLATFORM ANALYTICS
// ============================================

export const getPlatformStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await analyticsService.getPlatformStats();
  successResponse(res, 'Platform stats retrieved', stats);
});

export const getTodaySummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.query.agentId as string | undefined;
  const summary = await analyticsService.getTodaySummary(agentId);
  successResponse(res, 'Today summary retrieved', summary);
});

// ============================================
// REVENUE ANALYTICS
// ============================================

export const getRevenueData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period, startDate, endDate, agentId } = req.query;
  const data = await analyticsService.getRevenueData({
    period: (period as 'daily' | 'weekly' | 'monthly') || 'daily',
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    agentId: agentId as string,
  });
  successResponse(res, 'Revenue data retrieved', data);
});

// ============================================
// USER ANALYTICS
// ============================================

export const getUserGrowth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 30;
  const data = await analyticsService.getUserGrowth(days);
  successResponse(res, 'User growth data retrieved', data);
});

export const getTopBettors = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const agentId = req.query.agentId as string | undefined;
  const data = await analyticsService.getTopBettors(limit, agentId);
  successResponse(res, 'Top bettors retrieved', data);
});

// ============================================
// MATCH ANALYTICS
// ============================================

export const getMatchPnL = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const agentId = req.query.agentId as string | undefined;
  const data = await analyticsService.getMatchPnL({ limit, agentId });
  successResponse(res, 'Match P&L retrieved', data);
});

// ============================================
// AGENT ANALYTICS
// ============================================

export const getAgentPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.query.agentId as string | undefined;
  const data = await analyticsService.getAgentPerformance(agentId);
  successResponse(res, 'Agent performance retrieved', data);
});

// ============================================
// CASINO ANALYTICS
// ============================================

export const getCasinoAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await analyticsService.getCasinoAnalytics();
  successResponse(res, 'Casino analytics retrieved', data);
});

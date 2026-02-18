import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import matchService from '../services/match.service';
import betService from '../services/bet.service';
import prisma from '../db';

export const getMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, matchType, tournament, limit } = req.query;

  const matches = await matchService.getMatches({
    status: status as any,
    matchType: matchType as any,
    tournament: tournament as string,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  successResponse(res, 'Matches retrieved successfully', matches);
});

export const getMatchById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const match = await matchService.getMatchById(id);

  if (!match) {
    return errorResponse(res, 'Match not found', 404);
  }

  successResponse(res, 'Match retrieved successfully', match);
});

export const syncMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await matchService.syncMatches();
  successResponse(res, 'Matches synced successfully', result);
});

export const updateScores = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await matchService.updateMatchScores();
  successResponse(res, 'Scores updated successfully', result);
});

// ============================================
// MATCH SETTLEMENT
// ============================================

/**
 * Settle all bets for a completed match
 * PUT /api/v1/matches/:id/settle
 */
export const settleMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { winner, topBatsman, topBowler, totalRuns, totalWickets } = req.body;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return errorResponse(res, 'Match not found', 404);
  if (match.isSettled) return errorResponse(res, 'Match already settled', 400);

  const result: any = { winner };
  if (topBatsman) result.topBatsman = topBatsman;
  if (topBowler) result.topBowler = topBowler;
  if (totalRuns !== undefined) result.totalRuns = totalRuns;
  if (totalWickets !== undefined) result.totalWickets = totalWickets;

  const settlement = await betService.settleMatchBets(id, result, req.user!.id);
  successResponse(res, 'Match settled successfully', settlement);
});

/**
 * Void all bets for a cancelled match (refund users)
 * PUT /api/v1/matches/:id/void
 */
export const voidMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return errorResponse(res, 'Match not found', 404);
  if (match.isSettled) return errorResponse(res, 'Match already settled/voided', 400);

  const result = await betService.voidMatchBets(id, reason || 'Match voided by admin');
  successResponse(res, 'Match voided successfully', result);
});

/**
 * Get settlement summary for a match
 * GET /api/v1/matches/:id/settlement
 */
export const getMatchSettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      isSettled: true,
      settledAt: true,
      settledBy: true,
      matchWinner: true,
      totalBetsCount: true,
      totalBetsAmount: true,
      _count: {
        select: { bets: true },
      },
    },
  });

  if (!match) return errorResponse(res, 'Match not found', 404);

  // Get bet settlement breakdown
  const betStats = await prisma.bet.groupBy({
    by: ['status'],
    where: { matchId: id },
    _count: true,
    _sum: { amount: true, actualWin: true },
  });

  successResponse(res, 'Match settlement info retrieved', {
    match,
    betBreakdown: betStats,
  });
});

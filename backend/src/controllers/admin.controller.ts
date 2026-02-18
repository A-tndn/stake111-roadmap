import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../db';
import reportService from '../services/report.service';

// ============================================
// CLIENT MANAGEMENT
// ============================================

export const getClients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { page = '1', limit = '20', status, search } = req.query;

  const where: any = { agentId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { username: { contains: search as string, mode: 'insensitive' } },
      { displayName: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [clients, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        balance: true,
        creditLimit: true,
        sportSharePercent: true,
        accountType: true,
        matchLimit: true,
        sessionLimit: true,
        minBet: true,
        maxBet: true,
        userLocked: true,
        betLocked: true,
        status: true,
        createdAt: true,
        _count: { select: { bets: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  successResponse(res, 'Clients retrieved successfully', {
    clients,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / take),
    },
  });
});

export const getClientById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const agentId = req.user!.id;

  const client = await prisma.user.findFirst({
    where: { id, agentId },
    include: {
      _count: { select: { bets: true, transactions: true, depositRequests: true, withdrawalRequests: true } },
    },
  });

  if (!client) return errorResponse(res, 'Client not found', 404);
  successResponse(res, 'Client retrieved successfully', client);
});

export const updateClient = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const agentId = req.user!.id;

  // Verify ownership
  const client = await prisma.user.findFirst({ where: { id, agentId } });
  if (!client) return errorResponse(res, 'Client not found', 404);

  const {
    displayName, email, phone, creditLimit, sportSharePercent,
    accountType, matchLimit, sessionLimit, minBet, maxBet,
  } = req.body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(displayName && { displayName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(creditLimit !== undefined && { creditLimit }),
      ...(sportSharePercent !== undefined && { sportSharePercent }),
      ...(accountType && { accountType }),
      ...(matchLimit !== undefined && { matchLimit }),
      ...(sessionLimit !== undefined && { sessionLimit }),
      ...(minBet !== undefined && { minBet }),
      ...(maxBet !== undefined && { maxBet }),
    },
  });

  successResponse(res, 'Client updated successfully', updated);
});

export const toggleClientLock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const agentId = req.user!.id;

  const client = await prisma.user.findFirst({ where: { id, agentId } });
  if (!client) return errorResponse(res, 'Client not found', 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { userLocked: !client.userLocked },
  });

  successResponse(res, `Client ${updated.userLocked ? 'locked' : 'unlocked'} successfully`, updated);
});

export const toggleClientBetLock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const agentId = req.user!.id;

  const client = await prisma.user.findFirst({ where: { id, agentId } });
  if (!client) return errorResponse(res, 'Client not found', 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { betLocked: !client.betLocked },
  });

  successResponse(res, `Client bet ${updated.betLocked ? 'locked' : 'unlocked'} successfully`, updated);
});

export const bulkUpdateLimits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { clientIds, creditLimit, matchLimit, sessionLimit, minBet, maxBet } = req.body;

  // Verify all clients belong to this agent
  const clients = await prisma.user.findMany({
    where: { id: { in: clientIds }, agentId },
    select: { id: true },
  });

  if (clients.length !== clientIds.length) {
    return errorResponse(res, 'Some clients not found or do not belong to you', 400);
  }

  const updateData: any = {};
  if (creditLimit !== undefined) updateData.creditLimit = creditLimit;
  if (matchLimit !== undefined) updateData.matchLimit = matchLimit;
  if (sessionLimit !== undefined) updateData.sessionLimit = sessionLimit;
  if (minBet !== undefined) updateData.minBet = minBet;
  if (maxBet !== undefined) updateData.maxBet = maxBet;

  await prisma.user.updateMany({
    where: { id: { in: clientIds }, agentId },
    data: updateData,
  });

  successResponse(res, `Limits updated for ${clients.length} clients`);
});

export const getClientReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const agentId = req.user!.id;

  // Verify ownership
  const client = await prisma.user.findFirst({ where: { id, agentId } });
  if (!client) return errorResponse(res, 'Client not found', 404);

  const { startDate, endDate } = req.query;
  const report = await reportService.getUserReport({
    userId: id,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  successResponse(res, 'Client report retrieved', report);
});

// ============================================
// MATCH MANAGEMENT
// ============================================

export const getCurrentMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const matches = await prisma.match.findMany({
    where: { status: { in: ['UPCOMING', 'LIVE'] } },
    include: {
      _count: { select: { bets: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  successResponse(res, 'Current matches retrieved', matches);
});

export const getCompletedMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where: { status: 'COMPLETED' },
      include: { _count: { select: { bets: true } } },
      orderBy: { startTime: 'desc' },
      skip,
      take,
    }),
    prisma.match.count({ where: { status: 'COMPLETED' } }),
  ]);

  successResponse(res, 'Completed matches retrieved', {
    matches,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / take),
    },
  });
});

export const updateMatchOdds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    team1BackOdds, team1LayOdds,
    team2BackOdds, team2LayOdds,
    drawBackOdds, drawLayOdds,
  } = req.body;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return errorResponse(res, 'Match not found', 404);

  // Save odds history
  await prisma.matchOddsHistory.create({
    data: {
      matchId: id,
      team1BackOdds: match.team1BackOdds,
      team1LayOdds: match.team1LayOdds,
      team2BackOdds: match.team2BackOdds,
      team2LayOdds: match.team2LayOdds,
      drawBackOdds: match.drawBackOdds,
      drawLayOdds: match.drawLayOdds,
      source: 'ADMIN',
      changedBy: req.user!.id,
    },
  });

  const updated = await prisma.match.update({
    where: { id },
    data: {
      ...(team1BackOdds !== undefined && { team1BackOdds }),
      ...(team1LayOdds !== undefined && { team1LayOdds }),
      ...(team2BackOdds !== undefined && { team2BackOdds }),
      ...(team2LayOdds !== undefined && { team2LayOdds }),
      ...(drawBackOdds !== undefined && { drawBackOdds }),
      ...(drawLayOdds !== undefined && { drawLayOdds }),
    },
  });

  // TODO: Emit Socket.io event for real-time odds update
  successResponse(res, 'Odds updated successfully', updated);
});

export const toggleMatchBetting = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return errorResponse(res, 'Match not found', 404);

  const updated = await prisma.match.update({
    where: { id },
    data: { bettingLocked: !match.bettingLocked },
  });

  successResponse(res, `Betting ${updated.bettingLocked ? 'locked' : 'unlocked'} for match`, updated);
});

export const getMatchBets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [bets, total] = await Promise.all([
    prisma.bet.findMany({
      where: { matchId: id },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.bet.count({ where: { matchId: id } }),
  ]);

  successResponse(res, 'Match bets retrieved', {
    bets,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / take),
    },
  });
});

// ============================================
// ADMIN DASHBOARD
// ============================================

export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;

  const [
    totalClients,
    activeClients,
    pendingDeposits,
    pendingWithdrawals,
    liveMatches,
  ] = await Promise.all([
    prisma.user.count({ where: { agentId } }),
    prisma.user.count({ where: { agentId, status: 'ACTIVE' } }),
    prisma.depositRequest.count({
      where: { user: { agentId }, status: 'PENDING' },
    }),
    prisma.withdrawalRequest.count({
      where: { user: { agentId }, status: 'PENDING' },
    }),
    prisma.match.count({ where: { status: 'LIVE' } }),
  ]);

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      balance: true, creditLimit: true, commissionRate: true,
      totalCommission: true, pendingSettlement: true,
    },
  });

  successResponse(res, 'Dashboard stats retrieved', {
    totalClients,
    activeClients,
    pendingDeposits,
    pendingWithdrawals,
    liveMatches,
    agent,
  });
});

// ============================================
// ADMIN REPORTS
// ============================================

export const getMyReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const agentId = req.user!.id;
  const { startDate, endDate, page, limit } = req.query;

  const report = await reportService.getUserReport({
    agentId,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  successResponse(res, 'Reports retrieved', report);
});

// ============================================
// LEDGER
// ============================================

export const getUserLedger = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const agentId = req.user!.id;
  const { page = '1', limit = '20', type } = req.query;

  // Verify the user belongs to this agent
  const user = await prisma.user.findFirst({ where: { id: userId, agentId } });
  if (!user) return errorResponse(res, 'User not found', 404);

  const where: any = { userId };
  if (type) where.type = type;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
  ]);

  successResponse(res, 'Ledger retrieved', {
    transactions,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / take),
    },
  });
});

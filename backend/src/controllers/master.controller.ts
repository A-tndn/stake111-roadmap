import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../db';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import settlementService from '../services/settlement.service';
import reportService from '../services/report.service';
import systemSettingsService from '../services/systemSettings.service';
import auditLogService from '../services/auditLog.service';

// ============================================
// ADMIN/AGENT MANAGEMENT
// ============================================

export const getAllAdmins = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', status, agentType, search } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (agentType) where.agentType = agentType;
  if (search) {
    where.OR = [
      { username: { contains: search as string, mode: 'insensitive' } },
      { displayName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        agentType: true,
        status: true,
        balance: true,
        creditLimit: true,
        commissionRate: true,
        totalCommission: true,
        pendingSettlement: true,
        permissions: true,
        userLocked: true,
        betLocked: true,
        totalClients: true,
        activeClients: true,
        totalRevenue: true,
        parentAgentId: true,
        parentAgent: { select: { id: true, displayName: true, username: true } },
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { players: true, subAgents: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.agent.count({ where }),
  ]);

  successResponse(res, 'Admins retrieved successfully', {
    agents,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / take),
    },
  });
});

export const getAdminById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      parentAgent: { select: { id: true, displayName: true, username: true } },
      subAgents: {
        select: { id: true, displayName: true, username: true, agentType: true, status: true },
      },
      players: {
        select: {
          id: true, username: true, displayName: true, balance: true,
          status: true, userLocked: true, betLocked: true, createdAt: true,
        },
      },
      _count: { select: { players: true, subAgents: true, settlements: true } },
    },
  });

  if (!agent) return errorResponse(res, 'Agent not found', 404);

  successResponse(res, 'Agent retrieved successfully', agent);
});

export const createAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    username, email, phone, password, displayName, agentType,
    parentAgentId, commissionRate, creditLimit, permissions,
    maxPlayersAllowed, sportSharePercent,
  } = req.body;

  // Check unique constraints
  const existing = await prisma.agent.findFirst({
    where: { OR: [{ username }, ...(email ? [{ email }] : []), { phone }] },
  });
  if (existing) return errorResponse(res, 'Username, email, or phone already exists', 400);

  const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

  const agent = await prisma.agent.create({
    data: {
      username,
      email,
      phone,
      password: hashedPassword,
      displayName,
      agentType,
      parentAgentId,
      commissionRate: commissionRate || 0,
      creditLimit: creditLimit || 0,
      permissions: permissions || [],
      maxPlayersAllowed: maxPlayersAllowed || 100,
      sportSharePercent: sportSharePercent || 0,
      status: 'ACTIVE',
      createdBy: req.user!.id,
    },
  });

  // Audit log
  await auditLogService.logAction(
    req.user!.id, 'MASTER_ADMIN', req.user!.username,
    'CREATE', 'AGENT', agent.id,
    { module: 'ADMIN_MANAGEMENT', newData: { username, agentType, commissionRate } },
    { ip: req.ip, userAgent: req.headers['user-agent'], method: req.method, path: req.originalUrl }
  );

  successResponse(res, 'Admin/Agent created successfully', agent, 201);
});

export const updateAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Don't allow password update through this endpoint
  delete updateData.password;

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) return errorResponse(res, 'Agent not found', 404);

  const updated = await prisma.agent.update({
    where: { id },
    data: updateData,
  });

  await auditLogService.logAction(
    req.user!.id, 'MASTER_ADMIN', req.user!.username,
    'UPDATE', 'AGENT', id,
    { module: 'ADMIN_MANAGEMENT', previousData: agent, newData: updated },
    { ip: req.ip, userAgent: req.headers['user-agent'], method: req.method, path: req.originalUrl }
  );

  successResponse(res, 'Agent updated successfully', updated);
});

export const deleteAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: { _count: { select: { players: true, subAgents: true } } },
  });

  if (!agent) return errorResponse(res, 'Agent not found', 404);

  if (agent._count.players > 0 || agent._count.subAgents > 0) {
    return errorResponse(res, 'Cannot delete agent with active clients or sub-agents. Block them instead.', 400);
  }

  await prisma.agent.update({
    where: { id },
    data: { status: 'BLOCKED' },
  });

  await auditLogService.logAction(
    req.user!.id, 'MASTER_ADMIN', req.user!.username,
    'DELETE', 'AGENT', id,
    { module: 'ADMIN_MANAGEMENT' },
    { ip: req.ip, userAgent: req.headers['user-agent'], method: req.method, path: req.originalUrl }
  );

  successResponse(res, 'Agent blocked successfully');
});

export const toggleAdminLock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) return errorResponse(res, 'Agent not found', 404);

  const updated = await prisma.agent.update({
    where: { id },
    data: { userLocked: !agent.userLocked },
  });

  successResponse(res, `Agent ${updated.userLocked ? 'locked' : 'unlocked'} successfully`, updated);
});

export const toggleAdminBetLock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) return errorResponse(res, 'Agent not found', 404);

  const updated = await prisma.agent.update({
    where: { id },
    data: { betLocked: !agent.betLocked },
  });

  successResponse(res, `Agent bet ${updated.betLocked ? 'locked' : 'unlocked'} successfully`, updated);
});

export const resetAdminPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) return errorResponse(res, 'Agent not found', 404);

  const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
  await prisma.agent.update({
    where: { id },
    data: { password: hashedPassword },
  });

  await auditLogService.logAction(
    req.user!.id, 'MASTER_ADMIN', req.user!.username,
    'RESET_PASSWORD', 'AGENT', id,
    { module: 'ADMIN_MANAGEMENT' },
    { ip: req.ip, userAgent: req.headers['user-agent'], method: req.method, path: req.originalUrl }
  );

  successResponse(res, 'Password reset successfully');
});

export const updateAdminPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { permissions } = req.body;

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) return errorResponse(res, 'Agent not found', 404);

  const updated = await prisma.agent.update({
    where: { id },
    data: { permissions },
  });

  successResponse(res, 'Permissions updated successfully', updated);
});

export const getAdminHierarchy = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get top-level agents (no parent)
  const topLevelAgents = await prisma.agent.findMany({
    where: { parentAgentId: null },
    include: {
      subAgents: {
        include: {
          subAgents: {
            include: {
              players: {
                select: { id: true, username: true, displayName: true, status: true },
              },
            },
          },
          players: {
            select: { id: true, username: true, displayName: true, status: true },
          },
        },
      },
      players: {
        select: { id: true, username: true, displayName: true, status: true },
      },
    },
  });

  successResponse(res, 'Hierarchy retrieved successfully', topLevelAgents);
});

export const getAdminClients = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [clients, total] = await Promise.all([
    prisma.user.findMany({
      where: { agentId: id },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where: { agentId: id } }),
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

// ============================================
// SETTLEMENTS
// ============================================

export const getSettlements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { agentId, status, page, limit, startDate, endDate } = req.query;
  const result = await settlementService.getSettlements({
    agentId: agentId as string,
    status: status as any,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });
  successResponse(res, 'Settlements retrieved successfully', result);
});

export const getSettlementById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await settlementService.getSettlementById(req.params.id);
  if (!result) return errorResponse(res, 'Settlement not found', 404);
  successResponse(res, 'Settlement retrieved successfully', result);
});

export const generateSettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { agentId, periodStart, periodEnd } = req.body;
  const result = await settlementService.generateSettlement(
    agentId, new Date(periodStart), new Date(periodEnd)
  );
  successResponse(res, 'Settlement generated successfully', result, 201);
});

export const generateAllSettlements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { periodStart, periodEnd } = req.body;
  const results = await settlementService.generateAllSettlements(
    new Date(periodStart), new Date(periodEnd)
  );
  successResponse(res, 'Settlements generated', results);
});

export const approveSettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await settlementService.approveSettlement(req.params.id, req.user!.id);
  successResponse(res, 'Settlement approved successfully', result);
});

export const paySettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await settlementService.paySettlement(req.params.id, req.user!.id, req.body);
  successResponse(res, 'Settlement paid successfully', result);
});

export const rejectSettlement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { remarks } = req.body;
  const result = await settlementService.rejectSettlement(req.params.id, remarks);
  successResponse(res, 'Settlement rejected', result);
});

// ============================================
// SYSTEM SETTINGS
// ============================================

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await systemSettingsService.getSettings();
  successResponse(res, 'Settings retrieved successfully', settings);
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await systemSettingsService.updateSettings(req.body, req.user!.id);
  successResponse(res, 'Settings updated successfully', settings);
});

export const updateCommissionStructure = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await systemSettingsService.updateCommissionStructure(req.body, req.user!.id);
  successResponse(res, 'Commission structure updated', settings);
});

export const updateBettingLimits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await systemSettingsService.updateBettingLimits(req.body, req.user!.id);
  successResponse(res, 'Betting limits updated', settings);
});

export const toggleMaintenanceMode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await systemSettingsService.toggleMaintenanceMode(req.user!.id);
  successResponse(res, `Maintenance mode ${settings.maintenanceMode ? 'enabled' : 'disabled'}`, settings);
});

// ============================================
// REPORTS
// ============================================

export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await reportService.getPlatformOverview();
  successResponse(res, 'Dashboard stats retrieved', stats);
});

export const getFinancialReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, groupBy } = req.query;
  const report = await reportService.getFinancialReport({
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    groupBy: groupBy as any,
  });
  successResponse(res, 'Financial report retrieved', report);
});

export const getUserReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, agentId, startDate, endDate, page, limit } = req.query;
  const report = await reportService.getUserReport({
    userId: userId as string,
    agentId: agentId as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  successResponse(res, 'User report retrieved', report);
});

export const getMatchReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { matchId, startDate, endDate, page, limit } = req.query;
  const report = await reportService.getMatchReport({
    matchId: matchId as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  successResponse(res, 'Match report retrieved', report);
});

export const getAgentReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { agentId } = req.query;
  const report = await reportService.getAgentReport(agentId as string);
  successResponse(res, 'Agent report retrieved', report);
});

// ============================================
// GLOBAL TRANSACTIONS
// ============================================

export const getAllTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, status, userId, agentId, page = '1', limit = '20', startDate, endDate } = req.query;

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (agentId) where.agentId = agentId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, displayName: true } },
        agent: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
  ]);

  successResponse(res, 'Transactions retrieved', {
    transactions,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / take),
    },
  });
});

// ============================================
// AUDIT LOGS
// ============================================

export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, userType, action, resource, module, status, startDate, endDate, search, page, limit } = req.query;
  const result = await auditLogService.getLogs({
    userId: userId as string,
    userType: userType as string,
    action: action as string,
    resource: resource as string,
    module: module as string,
    status: status as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    search: search as string,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  successResponse(res, 'Audit logs retrieved', result);
});

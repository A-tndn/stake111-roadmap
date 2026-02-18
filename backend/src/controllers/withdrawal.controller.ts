import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import withdrawalService from '../services/withdrawal.service';

export const createWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const withdrawal = await withdrawalService.createWithdrawalRequest({
    userId,
    ...req.body,
  });
  successResponse(res, 'Withdrawal request submitted successfully', withdrawal, 201);
});

export const getMyWithdrawals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page, limit } = req.query;
  const result = await withdrawalService.getWithdrawalRequests({
    userId: req.user!.id,
    status: status as any,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  successResponse(res, 'Withdrawals retrieved successfully', result);
});

export const getAllWithdrawals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, status, page, limit, startDate, endDate } = req.query;
  const result = await withdrawalService.getWithdrawalRequests({
    userId: userId as string,
    status: status as any,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });
  successResponse(res, 'Withdrawals retrieved successfully', result);
});

export const getWithdrawalById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const withdrawal = await withdrawalService.getWithdrawalById(req.params.id);
  if (!withdrawal) return errorResponse(res, 'Withdrawal not found', 404);
  successResponse(res, 'Withdrawal retrieved successfully', withdrawal);
});

export const approveWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await withdrawalService.approveWithdrawal(req.params.id, req.user!.id, req.body);
  successResponse(res, 'Withdrawal approved successfully', result);
});

export const rejectWithdrawal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { remarks } = req.body;
  if (!remarks) return errorResponse(res, 'Remarks are required for rejection', 400);
  const result = await withdrawalService.rejectWithdrawal(req.params.id, req.user!.id, remarks);
  successResponse(res, 'Withdrawal rejected', result);
});

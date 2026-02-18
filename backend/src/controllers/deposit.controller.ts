import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import depositService from '../services/deposit.service';

export const createDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const deposit = await depositService.createDepositRequest({
    userId,
    ...req.body,
  });
  successResponse(res, 'Deposit request submitted successfully', deposit, 201);
});

export const getMyDeposits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page, limit } = req.query;
  const result = await depositService.getDepositRequests({
    userId: req.user!.id,
    status: status as any,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  successResponse(res, 'Deposits retrieved successfully', result);
});

export const getAllDeposits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, status, page, limit, startDate, endDate } = req.query;
  const result = await depositService.getDepositRequests({
    userId: userId as string,
    status: status as any,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });
  successResponse(res, 'Deposits retrieved successfully', result);
});

export const getDepositById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deposit = await depositService.getDepositById(req.params.id);
  if (!deposit) return errorResponse(res, 'Deposit not found', 404);
  successResponse(res, 'Deposit retrieved successfully', deposit);
});

export const approveDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { remarks } = req.body;
  const result = await depositService.approveDeposit(req.params.id, req.user!.id, remarks);
  successResponse(res, 'Deposit approved successfully', result);
});

export const rejectDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { remarks } = req.body;
  if (!remarks) return errorResponse(res, 'Remarks are required for rejection', 400);
  const result = await depositService.rejectDeposit(req.params.id, req.user!.id, remarks);
  successResponse(res, 'Deposit rejected', result);
});

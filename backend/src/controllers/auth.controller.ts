import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import authService from '../services/auth.service';
import { recordFailedLogin, clearFailedLogins } from '../middleware/security';

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, password, userType } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

  try {
    let result;
    if (userType === 'agent') {
      result = await authService.loginAgent(username, password);
    } else {
      result = await authService.loginPlayer(username, password);
    }

    // Clear failed login attempts on success
    clearFailedLogins(ip);

    successResponse(res, 'Login successful', result);
  } catch (error) {
    // Record failed login attempt
    recordFailedLogin(ip);
    throw error;
  }
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.user!.id, req.user!.type);
  successResponse(res, 'User retrieved successfully', user);
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  successResponse(res, 'Logged out successfully');
});

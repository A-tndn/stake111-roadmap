import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/response';
import casinoService from '../services/casino.service';

// ============================================
// GAME MANAGEMENT (Admin)
// ============================================

export const getGames = asyncHandler(async (req: AuthRequest, res: Response) => {
  const includeDisabled = req.query.includeDisabled === 'true';
  const games = await casinoService.getGames(includeDisabled);
  successResponse(res, 'Games retrieved successfully', games);
});

export const getGameById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const game = await casinoService.getGameById(req.params.id);
  if (!game) return errorResponse(res, 'Game not found', 404);
  successResponse(res, 'Game retrieved successfully', game);
});

export const createGame = asyncHandler(async (req: AuthRequest, res: Response) => {
  const game = await casinoService.createGame(req.body);
  successResponse(res, 'Game created successfully', game, 201);
});

export const updateGame = asyncHandler(async (req: AuthRequest, res: Response) => {
  const game = await casinoService.updateGame(req.params.id, req.body);
  successResponse(res, 'Game updated successfully', game);
});

export const toggleGame = asyncHandler(async (req: AuthRequest, res: Response) => {
  const game = await casinoService.toggleGame(req.params.id);
  successResponse(res, `Game ${game.enabled ? 'enabled' : 'disabled'} successfully`, game);
});

export const deleteGame = asyncHandler(async (req: AuthRequest, res: Response) => {
  await casinoService.deleteGame(req.params.id);
  successResponse(res, 'Game disabled successfully');
});

// ============================================
// ROUND MANAGEMENT
// ============================================

export const createRound = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { gameId } = req.body;
  const round = await casinoService.createRound(gameId);
  successResponse(res, 'Round created successfully', round, 201);
});

export const closeRound = asyncHandler(async (req: AuthRequest, res: Response) => {
  const round = await casinoService.closeRound(req.params.id);
  successResponse(res, 'Round closed for betting', round);
});

export const settleRound = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { result } = req.body;
  const round = await casinoService.settleRound(req.params.id, result);
  successResponse(res, 'Round settled successfully', round);
});

// ============================================
// PLAYER BET MANAGEMENT
// ============================================

export const placeBet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const bet = await casinoService.placeBet({ userId, ...req.body });
  successResponse(res, 'Bet placed successfully', bet, 201);
});

export const instantPlay = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const result = await casinoService.instantPlay({ userId, ...req.body });
  successResponse(res, result.isWinner ? 'You won!' : 'Better luck next time', result, 201);
});

export const getBetHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { page, limit } = req.query;
  const result = await casinoService.getUserBetHistory(
    userId,
    page ? parseInt(page as string) : undefined,
    limit ? parseInt(limit as string) : undefined
  );
  successResponse(res, 'Bet history retrieved successfully', result);
});

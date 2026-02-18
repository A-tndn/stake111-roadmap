import prisma from '../db';
import { CasinoGameType, CasinoRoundStatus, BetStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';
import logger from '../config/logger';
import { generateGameResult, checkBetWin, getOdds, getValidBetTypes } from './casino/index';
import { emitToUser, emitBalanceUpdate } from '../utils/socketEmitter';

class CasinoService {
  // ============================================
  // GAME MANAGEMENT (Admin)
  // ============================================

  /**
   * Create a new casino game
   */
  async createGame(data: {
    gameName: string;
    gameType: CasinoGameType;
    description?: string;
    rules?: string;
    image?: string;
    minBet?: number;
    maxBet?: number;
    rtp?: number;
  }) {
    const houseEdge = data.rtp ? 100 - data.rtp : 4.0;

    return prisma.casinoGame.create({
      data: {
        gameName: data.gameName,
        gameType: data.gameType,
        description: data.description,
        rules: data.rules,
        image: data.image,
        minBet: data.minBet || 10,
        maxBet: data.maxBet || 10000,
        rtp: data.rtp || 96.0,
        houseEdge,
      },
    });
  }

  /**
   * Update a casino game
   */
  async updateGame(gameId: string, data: Partial<{
    gameName: string;
    description: string;
    rules: string;
    image: string;
    minBet: number;
    maxBet: number;
    rtp: number;
    enabled: boolean;
    sortOrder: number;
  }>) {
    const updateData: any = { ...data };
    if (data.rtp !== undefined) {
      updateData.houseEdge = 100 - data.rtp;
    }

    return prisma.casinoGame.update({
      where: { id: gameId },
      data: updateData,
    });
  }

  /**
   * Toggle game enabled/disabled
   */
  async toggleGame(gameId: string) {
    const game = await prisma.casinoGame.findUnique({ where: { id: gameId } });
    if (!game) throw new Error('Game not found');

    return prisma.casinoGame.update({
      where: { id: gameId },
      data: { enabled: !game.enabled },
    });
  }

  /**
   * Get all casino games
   */
  async getGames(includeDisabled = false) {
    const where: any = {};
    if (!includeDisabled) where.enabled = true;

    return prisma.casinoGame.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get game by ID
   */
  async getGameById(gameId: string) {
    return prisma.casinoGame.findUnique({ where: { id: gameId } });
  }

  /**
   * Delete a casino game (soft — just disable it)
   */
  async deleteGame(gameId: string) {
    return prisma.casinoGame.update({
      where: { id: gameId },
      data: { enabled: false },
    });
  }

  // ============================================
  // ROUND MANAGEMENT
  // ============================================

  /**
   * Generate a provably fair seed pair
   */
  private generateSeeds() {
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    return { serverSeed, serverSeedHash };
  }

  /**
   * Create a new game round
   */
  async createRound(gameId: string) {
    const game = await prisma.casinoGame.findUnique({ where: { id: gameId } });
    if (!game) throw new Error('Game not found');
    if (!game.enabled) throw new Error('Game is disabled');

    // Get next round number
    const lastRound = await prisma.casinoRound.findFirst({
      where: { gameId },
      orderBy: { roundNumber: 'desc' },
    });

    const { serverSeed, serverSeedHash } = this.generateSeeds();

    return prisma.casinoRound.create({
      data: {
        gameId,
        roundNumber: (lastRound?.roundNumber || 0) + 1,
        status: 'OPEN',
        serverSeed,
        serverSeedHash,
        nonce: 0,
      },
    });
  }

  /**
   * Close betting on a round
   */
  async closeRound(roundId: string) {
    return prisma.casinoRound.update({
      where: { id: roundId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  /**
   * Set result and settle a round
   */
  async settleRound(roundId: string, result: any) {
    const round = await prisma.casinoRound.findUnique({
      where: { id: roundId },
      include: { bets: true, game: true },
    });

    if (!round) throw new Error('Round not found');
    if (round.status === 'SETTLED') throw new Error('Round already settled');

    return prisma.$transaction(async (tx) => {
      let totalPayoutAmount = new Decimal(0);

      // Determine winners based on game type and result
      for (const bet of round.bets) {
        const isWinner = this.determineBetOutcome(round.game.gameType, bet.betType, bet.betData, result);
        const actualWin = isWinner ? bet.potentialWin : new Decimal(0);

        await tx.casinoBet.update({
          where: { id: bet.id },
          data: {
            status: isWinner ? 'WON' : 'LOST',
            actualWin,
            settledAt: new Date(),
          },
        });

        if (isWinner) {
          totalPayoutAmount = totalPayoutAmount.add(actualWin);

          // Credit user balance
          const user = await tx.user.findUnique({ where: { id: bet.userId } });
          if (user) {
            await tx.user.update({
              where: { id: bet.userId },
              data: { balance: { increment: actualWin } },
            });

            // Create transaction
            await tx.transaction.create({
              data: {
                userId: bet.userId,
                type: 'BET_WON',
                status: 'COMPLETED',
                amount: actualWin,
                balanceBefore: user.balance,
                balanceAfter: user.balance.add(actualWin),
                referenceId: bet.id,
                referenceType: 'CASINO_BET',
                description: `Casino win: ${round.game.gameName} Round #${round.roundNumber}`,
              },
            });
          }
        }
      }

      // Update round
      return tx.casinoRound.update({
        where: { id: roundId },
        data: {
          status: 'SETTLED',
          result,
          settledAt: new Date(),
          totalPayoutAmount,
        },
      });
    });
  }

  /**
   * Determine if a bet won based on game type
   * This is a simplified version — each game type will have its own logic
   */
  private determineBetOutcome(
    gameType: CasinoGameType,
    betType: string,
    betData: any,
    result: any
  ): boolean {
    switch (gameType) {
      case 'COIN_FLIP':
        return betType === result.outcome; // 'HEADS' or 'TAILS'

      case 'HI_LO':
        if (betType === 'HIGH') return result.value > 7;
        if (betType === 'LOW') return result.value < 7;
        return result.value === 7; // exact

      case 'DICE_ROLL':
        if (betType === 'OVER') return result.total > (betData?.target || 7);
        if (betType === 'UNDER') return result.total < (betData?.target || 7);
        return result.total === (betData?.target || 7);

      case 'TEEN_PATTI':
      case 'INDIAN_POKER':
        return betType === result.winner; // 'PLAYER_A' or 'PLAYER_B'

      default:
        return false;
    }
  }

  // ============================================
  // BET MANAGEMENT
  // ============================================

  /**
   * Place a casino bet
   */
  async placeBet(data: {
    userId: string;
    roundId: string;
    betType: string;
    betData?: any;
    amount: number;
  }) {
    const round = await prisma.casinoRound.findUnique({
      where: { id: data.roundId },
      include: { game: true },
    });

    if (!round) throw new Error('Round not found');
    if (round.status !== 'OPEN') throw new Error('Round is not open for betting');

    const game = round.game;
    if (data.amount < game.minBet.toNumber()) throw new Error(`Minimum bet is ${game.minBet}`);
    if (data.amount > game.maxBet.toNumber()) throw new Error(`Maximum bet is ${game.maxBet}`);

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new Error('User not found');
    if (user.balance.toNumber() < data.amount) throw new Error('Insufficient balance');
    if (user.betLocked) throw new Error('Betting is locked for your account');

    // Calculate potential win based on game type and bet type
    const odds = this.calculateOdds(game.gameType, data.betType);
    const potentialWin = data.amount * odds;

    return prisma.$transaction(async (tx) => {
      // Deduct balance
      const balanceBefore = user.balance;
      const balanceAfter = balanceBefore.sub(new Decimal(data.amount));

      await tx.user.update({
        where: { id: data.userId },
        data: { balance: balanceAfter },
      });

      // Create bet
      const bet = await tx.casinoBet.create({
        data: {
          userId: data.userId,
          roundId: data.roundId,
          betType: data.betType,
          betData: data.betData,
          amount: data.amount,
          odds,
          potentialWin,
          status: 'PENDING',
        },
      });

      // Create transaction
      await tx.transaction.create({
        data: {
          userId: data.userId,
          type: 'BET_PLACED',
          status: 'COMPLETED',
          amount: data.amount,
          balanceBefore,
          balanceAfter,
          referenceId: bet.id,
          referenceType: 'CASINO_BET',
          description: `Casino bet: ${game.gameName} Round #${round.roundNumber}`,
        },
      });

      // Update round totals
      await tx.casinoRound.update({
        where: { id: data.roundId },
        data: { totalBetAmount: { increment: data.amount } },
      });

      return bet;
    });
  }

  /**
   * Calculate odds for a bet type
   */
  private calculateOdds(gameType: CasinoGameType, betType: string): number {
    switch (gameType) {
      case 'COIN_FLIP':
        return 1.95; // 50/50 with house edge

      case 'HI_LO':
        if (betType === 'HIGH' || betType === 'LOW') return 1.95;
        return 13.0; // exact number

      case 'DICE_ROLL':
        if (betType === 'OVER' || betType === 'UNDER') return 1.95;
        return 6.0; // exact number

      case 'TEEN_PATTI':
      case 'INDIAN_POKER':
        return 1.95; // 50/50 with house edge

      default:
        return 2.0;
    }
  }

  // ============================================
  // INSTANT PLAY (bet + generate result + settle in one step)
  // ============================================

  /**
   * Play an instant casino game — single API call for the full flow
   * Creates round → places bet → generates result → settles → returns result
   */
  async instantPlay(data: {
    userId: string;
    gameId: string;
    betType: string;
    betData?: any;
    amount: number;
    clientSeed?: string;
  }) {
    const game = await prisma.casinoGame.findUnique({ where: { id: data.gameId } });
    if (!game) throw new Error('Game not found');
    if (!game.enabled) throw new Error('Game is currently disabled');

    // Validate bet type
    const validTypes = getValidBetTypes(game.gameType);
    if (!validTypes.includes(data.betType)) {
      throw new Error(`Invalid bet type. Valid: ${validTypes.join(', ')}`);
    }

    // Validate amount
    if (data.amount < game.minBet.toNumber()) throw new Error(`Minimum bet is ₹${game.minBet}`);
    if (data.amount > game.maxBet.toNumber()) throw new Error(`Maximum bet is ₹${game.maxBet}`);

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new Error('User not found');
    if (user.balance.toNumber() < data.amount) throw new Error('Insufficient balance');
    if (user.betLocked) throw new Error('Betting is locked for your account');

    // Generate provably fair seeds
    const { serverSeed, serverSeedHash } = this.generateSeeds();
    const clientSeed = data.clientSeed || crypto.randomBytes(16).toString('hex');

    // Get next round number
    const lastRound = await prisma.casinoRound.findFirst({
      where: { gameId: data.gameId },
      orderBy: { roundNumber: 'desc' },
    });
    const roundNumber = (lastRound?.roundNumber || 0) + 1;

    // Calculate odds
    const odds = getOdds(game.gameType, data.betType);
    const potentialWin = data.amount * odds;

    // Generate result
    const gameResult = generateGameResult(game.gameType, serverSeed, clientSeed, 0);
    const isWinner = checkBetWin(game.gameType, data.betType, data.betData, gameResult.outcome);
    const actualWin = isWinner ? potentialWin : 0;

    // Execute everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create round (immediately settled)
      const round = await tx.casinoRound.create({
        data: {
          gameId: data.gameId,
          roundNumber,
          status: 'SETTLED',
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: 0,
          result: gameResult.outcome,
          startedAt: new Date(),
          closedAt: new Date(),
          settledAt: new Date(),
          totalBetAmount: data.amount,
          totalPayoutAmount: actualWin,
        },
      });

      // 2. Deduct bet amount from balance
      const balanceBefore = user.balance;
      let balanceAfter = balanceBefore.sub(new Decimal(data.amount));

      await tx.user.update({
        where: { id: data.userId },
        data: { balance: balanceAfter },
      });

      // 3. Create bet record
      const bet = await tx.casinoBet.create({
        data: {
          userId: data.userId,
          roundId: round.id,
          betType: data.betType,
          betData: data.betData,
          amount: data.amount,
          odds,
          potentialWin,
          actualWin,
          status: isWinner ? 'WON' : 'LOST',
          settledAt: new Date(),
        },
      });

      // 4. Create bet placed transaction
      await tx.transaction.create({
        data: {
          userId: data.userId,
          type: 'BET_PLACED',
          status: 'COMPLETED',
          amount: data.amount,
          balanceBefore,
          balanceAfter,
          referenceId: bet.id,
          referenceType: 'CASINO_BET',
          description: `Casino bet: ${game.gameName} Round #${roundNumber}`,
        },
      });

      // 5. If winner, credit winnings
      if (isWinner) {
        const winBalanceBefore = balanceAfter;
        balanceAfter = balanceAfter.add(new Decimal(actualWin));

        await tx.user.update({
          where: { id: data.userId },
          data: { balance: balanceAfter },
        });

        await tx.transaction.create({
          data: {
            userId: data.userId,
            type: 'BET_WON',
            status: 'COMPLETED',
            amount: actualWin,
            balanceBefore: winBalanceBefore,
            balanceAfter,
            referenceId: bet.id,
            referenceType: 'CASINO_BET',
            description: `Casino win: ${game.gameName} Round #${roundNumber}`,
          },
        });
      }

      return {
        round: {
          id: round.id,
          roundNumber,
          serverSeedHash,
          serverSeed, // revealed after settlement
          clientSeed,
        },
        bet: {
          id: bet.id,
          betType: data.betType,
          amount: data.amount,
          odds,
          potentialWin,
          actualWin,
          status: isWinner ? 'WON' : 'LOST',
        },
        result: gameResult.outcome,
        resultDisplay: gameResult.display,
        isWinner,
        newBalance: balanceAfter.toNumber(),
      };
    });

    // Emit real-time balance update
    try {
      emitBalanceUpdate(data.userId, result.newBalance, `Casino: ${game.gameName}`);
      emitToUser(data.userId, 'casino:result', {
        gameType: game.gameType,
        gameName: game.gameName,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      logger.warn('Failed to emit casino socket event', e);
    }

    return result;
  }

  /**
   * Get current open round for a game (or create one)
   */
  async getOrCreateOpenRound(gameId: string) {
    const openRound = await prisma.casinoRound.findFirst({
      where: { gameId, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });

    if (openRound) return openRound;
    return this.createRound(gameId);
  }

  /**
   * Get user's casino bet history
   */
  async getUserBetHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [bets, total] = await Promise.all([
      prisma.casinoBet.findMany({
        where: { userId },
        include: {
          round: {
            include: { game: { select: { gameName: true, gameType: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.casinoBet.count({ where: { userId } }),
    ]);

    return {
      bets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export default new CasinoService();

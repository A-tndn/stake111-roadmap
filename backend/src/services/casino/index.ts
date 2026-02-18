/**
 * Casino Game Engine Index
 * Routes game types to their specific engine implementations
 */

import { CasinoGameType } from '@prisma/client';
import { generateCoinFlipResult, checkCoinFlipWin } from './coinFlip';
import { generateDiceResult, checkDiceWin } from './dice';
import { generateHiLoResult, checkHiLoWin } from './hiLo';
import { generateTeenPattiResult, generateIndianPokerResult, checkTeenPattiWin } from './teenPatti';
import { GameResult } from './gameEngine';

/**
 * Generate a provably fair result for any game type
 */
export function generateGameResult(
  gameType: CasinoGameType,
  serverSeed: string,
  clientSeed: string,
  nonce: number
): GameResult {
  switch (gameType) {
    case 'COIN_FLIP':
      return generateCoinFlipResult(serverSeed, clientSeed, nonce);
    case 'DICE_ROLL':
      return generateDiceResult(serverSeed, clientSeed, nonce);
    case 'HI_LO':
      return generateHiLoResult(serverSeed, clientSeed, nonce);
    case 'TEEN_PATTI':
      return generateTeenPattiResult(serverSeed, clientSeed, nonce);
    case 'INDIAN_POKER':
      return generateIndianPokerResult(serverSeed, clientSeed, nonce);
    default:
      // For unimplemented games, use coin flip as fallback
      return generateCoinFlipResult(serverSeed, clientSeed, nonce);
  }
}

/**
 * Check if a bet won for any game type
 */
export function checkBetWin(
  gameType: CasinoGameType,
  betType: string,
  betData: any,
  result: any
): boolean {
  switch (gameType) {
    case 'COIN_FLIP':
      return checkCoinFlipWin(betType, result);
    case 'DICE_ROLL':
      return checkDiceWin(betType, betData, result);
    case 'HI_LO':
      return checkHiLoWin(betType, result);
    case 'TEEN_PATTI':
    case 'INDIAN_POKER':
      return checkTeenPattiWin(betType, result);
    default:
      return false;
  }
}

/**
 * Get valid bet types for each game
 */
export function getValidBetTypes(gameType: CasinoGameType): string[] {
  switch (gameType) {
    case 'COIN_FLIP':
      return ['HEADS', 'TAILS'];
    case 'DICE_ROLL':
      return ['OVER', 'UNDER', 'EXACT'];
    case 'HI_LO':
      return ['HIGH', 'LOW', 'EXACT'];
    case 'TEEN_PATTI':
    case 'INDIAN_POKER':
      return ['PLAYER_A', 'PLAYER_B'];
    default:
      return [];
  }
}

/**
 * Get odds for a specific game type and bet type
 */
export function getOdds(gameType: CasinoGameType, betType: string): number {
  switch (gameType) {
    case 'COIN_FLIP':
      return 1.95;
    case 'HI_LO':
      return betType === 'EXACT' ? 13.0 : 1.95;
    case 'DICE_ROLL':
      return betType === 'EXACT' ? 6.0 : 1.95;
    case 'TEEN_PATTI':
    case 'INDIAN_POKER':
      return 1.95;
    default:
      return 2.0;
  }
}

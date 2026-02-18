import { generateHash, hashToMultipleInts, GameResult } from './gameEngine';

export interface DiceResult {
  dice1: number;
  dice2: number;
  total: number;
}

/**
 * Generate a provably fair dice roll result (2 dice)
 */
export function generateDiceResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): GameResult {
  const hash = generateHash(serverSeed, clientSeed, nonce);
  const [dice1, dice2] = hashToMultipleInts(hash, 2, 1, 6);
  const total = dice1 + dice2;

  return {
    outcome: { dice1, dice2, total },
    display: `🎲 ${dice1} + ${dice2} = ${total}`,
    serverSeed,
    clientSeed,
    nonce,
    hash,
  };
}

/**
 * Valid bet types for dice
 */
export const DICE_BET_TYPES = ['OVER', 'UNDER', 'EXACT'] as const;

/**
 * Check if a bet won
 * OVER: total > target (default 7)
 * UNDER: total < target (default 7)
 * EXACT: total === target
 */
export function checkDiceWin(betType: string, betData: any, result: any): boolean {
  const target = betData?.target || 7;
  switch (betType) {
    case 'OVER': return result.total > target;
    case 'UNDER': return result.total < target;
    case 'EXACT': return result.total === target;
    default: return false;
  }
}

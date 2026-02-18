import { generateHash, hashToFloat, GameResult } from './gameEngine';

export interface CoinFlipResult {
  outcome: 'HEADS' | 'TAILS';
  display: string;
}

/**
 * Generate a provably fair coin flip result
 */
export function generateCoinFlipResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): GameResult {
  const hash = generateHash(serverSeed, clientSeed, nonce);
  const value = hashToFloat(hash);

  const outcome: 'HEADS' | 'TAILS' = value < 0.5 ? 'HEADS' : 'TAILS';

  return {
    outcome: { outcome, value: Math.round(value * 100) / 100 },
    display: outcome === 'HEADS' ? '🪙 Heads' : '🪙 Tails',
    serverSeed,
    clientSeed,
    nonce,
    hash,
  };
}

/**
 * Valid bet types for coin flip
 */
export const COIN_FLIP_BET_TYPES = ['HEADS', 'TAILS'] as const;

/**
 * Check if a bet won
 */
export function checkCoinFlipWin(betType: string, result: any): boolean {
  return betType === result.outcome;
}

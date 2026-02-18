import { generateHash, hashToInt, GameResult } from './gameEngine';

export interface HiLoResult {
  value: number;      // 1-13 (Ace to King)
  cardName: string;   // "Ace", "2", ..., "King"
  suit: string;       // "♠", "♥", "♦", "♣"
}

const CARD_NAMES = ['', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
const SUITS = ['♠', '♥', '♦', '♣'];

/**
 * Generate a provably fair Hi-Lo result
 */
export function generateHiLoResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): GameResult {
  const hash = generateHash(serverSeed, clientSeed, nonce);
  const value = hashToInt(hash, 1, 13);

  // Use different part of hash for suit (cosmetic only, doesn't affect outcome)
  const suitIndex = parseInt(hash.substring(8, 10), 16) % 4;
  const suit = SUITS[suitIndex];
  const cardName = CARD_NAMES[value];

  return {
    outcome: { value, cardName, suit },
    display: `${cardName} ${suit} (${value})`,
    serverSeed,
    clientSeed,
    nonce,
    hash,
  };
}

/**
 * Valid bet types for Hi-Lo
 */
export const HI_LO_BET_TYPES = ['HIGH', 'LOW', 'EXACT'] as const;

/**
 * Check if a bet won
 * HIGH: value > 7
 * LOW: value < 7
 * EXACT: value === 7
 */
export function checkHiLoWin(betType: string, result: any): boolean {
  switch (betType) {
    case 'HIGH': return result.value > 7;
    case 'LOW': return result.value < 7;
    case 'EXACT': return result.value === 7;
    default: return false;
  }
}

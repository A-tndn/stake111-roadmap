import { generateHash, hashToMultipleInts, GameResult } from './gameEngine';

const CARD_NAMES = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

interface Card {
  value: number;  // 1-13
  suit: number;   // 0-3
  display: string;
}

/**
 * Calculate hand strength for 3-card poker (Teen Patti)
 * Higher = better
 * Trail (3 of kind) > Pure Seq > Seq > Colour > Pair > High card
 */
function handStrength(cards: Card[]): number {
  const values = cards.map(c => c.value).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit);
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];

  // Check three of a kind (Trail)
  if (values[0] === values[1] && values[1] === values[2]) {
    return 50000 + values[0];
  }

  // Check sequence (considering A-2-3 as lowest straight)
  const isSeq =
    (values[2] - values[1] === 1 && values[1] - values[0] === 1) ||
    (values[0] === 1 && values[1] === 12 && values[2] === 13); // Q-K-A

  // Pure sequence (straight flush)
  if (isSeq && isFlush) return 40000 + values[2];

  // Sequence (straight)
  if (isSeq) return 30000 + values[2];

  // Colour (flush)
  if (isFlush) return 20000 + values[2] * 100 + values[1];

  // Pair
  if (values[0] === values[1]) return 10000 + values[0] * 100 + values[2];
  if (values[1] === values[2]) return 10000 + values[1] * 100 + values[0];

  // High card
  return values[2] * 10000 + values[1] * 100 + values[0];
}

/**
 * Generate a provably fair Teen Patti result
 */
export function generateTeenPattiResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): GameResult {
  const hash = generateHash(serverSeed, clientSeed, nonce);

  // Generate 6 unique card indices (0-51) for 2 players × 3 cards
  const cardIndices: number[] = [];
  let attempts = 0;
  while (cardIndices.length < 6 && attempts < 20) {
    const vals = hashToMultipleInts(
      hash + ':' + attempts,
      6 - cardIndices.length,
      0,
      51
    );
    for (const v of vals) {
      if (!cardIndices.includes(v) && cardIndices.length < 6) {
        cardIndices.push(v);
      }
    }
    attempts++;
  }

  // Ensure we have 6 cards (fallback)
  while (cardIndices.length < 6) {
    const fallback = (cardIndices.length * 7 + 3) % 52;
    if (!cardIndices.includes(fallback)) cardIndices.push(fallback);
  }

  const toCard = (index: number): Card => ({
    value: (index % 13) + 1,
    suit: Math.floor(index / 13),
    display: `${CARD_NAMES[(index % 13) + 1]}${SUITS[Math.floor(index / 13)]}`,
  });

  const playerACards = cardIndices.slice(0, 3).map(toCard);
  const playerBCards = cardIndices.slice(3, 6).map(toCard);

  const strengthA = handStrength(playerACards);
  const strengthB = handStrength(playerBCards);

  const winner = strengthA >= strengthB ? 'PLAYER_A' : 'PLAYER_B';

  return {
    outcome: {
      winner,
      playerA: { cards: playerACards.map(c => c.display), strength: strengthA },
      playerB: { cards: playerBCards.map(c => c.display), strength: strengthB },
    },
    display: `Player A: ${playerACards.map(c => c.display).join(' ')} vs Player B: ${playerBCards.map(c => c.display).join(' ')} → ${winner}`,
    serverSeed,
    clientSeed,
    nonce,
    hash,
  };
}

/**
 * Also used for Indian Poker (same mechanic, different presentation)
 */
export const generateIndianPokerResult = generateTeenPattiResult;

/**
 * Valid bet types
 */
export const TEEN_PATTI_BET_TYPES = ['PLAYER_A', 'PLAYER_B'] as const;

/**
 * Check if a bet won
 */
export function checkTeenPattiWin(betType: string, result: any): boolean {
  return betType === result.winner;
}

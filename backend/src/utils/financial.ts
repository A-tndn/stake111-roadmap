import { Decimal } from '@prisma/client/runtime/library';

/**
 * Financial calculation utilities using Prisma's Decimal (backed by decimal.js)
 * All money operations should go through these helpers to avoid floating-point errors.
 */

export const ZERO = new Decimal(0);

/**
 * Safely convert a number, string, or Decimal to Decimal
 */
export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

/**
 * Add two Decimal values
 */
export function add(a: Decimal | number, b: Decimal | number): Decimal {
  return toDecimal(a).add(toDecimal(b));
}

/**
 * Subtract b from a
 */
export function subtract(a: Decimal | number, b: Decimal | number): Decimal {
  return toDecimal(a).sub(toDecimal(b));
}

/**
 * Multiply two values
 */
export function multiply(a: Decimal | number, b: Decimal | number): Decimal {
  return toDecimal(a).mul(toDecimal(b));
}

/**
 * Divide a by b with safe zero check
 */
export function divide(a: Decimal | number, b: Decimal | number): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) throw new Error('Division by zero');
  return toDecimal(a).div(divisor);
}

/**
 * Calculate percentage: (value * percentage) / 100
 */
export function percentage(value: Decimal | number, pct: Decimal | number): Decimal {
  return multiply(value, pct).div(100);
}

/**
 * Check if value is negative
 */
export function isNegative(value: Decimal): boolean {
  return value.isNegative();
}

/**
 * Get absolute value
 */
export function abs(value: Decimal): Decimal {
  return value.isNegative() ? value.neg() : value;
}

/**
 * Compare: returns -1, 0, or 1
 */
export function compare(a: Decimal | number, b: Decimal | number): number {
  return toDecimal(a).cmp(toDecimal(b));
}

/**
 * Check if a >= b
 */
export function gte(a: Decimal | number, b: Decimal | number): boolean {
  return toDecimal(a).gte(toDecimal(b));
}

/**
 * Check if a > b
 */
export function gt(a: Decimal | number, b: Decimal | number): boolean {
  return toDecimal(a).gt(toDecimal(b));
}

/**
 * Format Decimal as fixed string with 2 decimal places
 */
export function formatMoney(value: Decimal | number): string {
  return toDecimal(value).toFixed(2);
}

/**
 * Calculate bet payout: stake * odds
 */
export function calculatePayout(stake: Decimal | number, odds: Decimal | number): Decimal {
  return multiply(stake, odds);
}

/**
 * Calculate commission: baseAmount * (commissionRate / 100)
 */
export function calculateCommission(
  baseAmount: Decimal | number,
  commissionRate: Decimal | number
): Decimal {
  return percentage(baseAmount, commissionRate);
}

/**
 * Calculate net profit: totalLoss - totalWin (from platform perspective)
 * Positive = platform profit, Negative = platform loss
 */
export function calculateNetProfit(
  totalLoss: Decimal | number,
  totalWin: Decimal | number
): Decimal {
  return subtract(totalLoss, totalWin);
}

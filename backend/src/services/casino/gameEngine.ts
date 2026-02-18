import crypto from 'crypto';

/**
 * Base provably fair game engine
 * Uses HMAC-SHA256 with serverSeed + clientSeed + nonce to generate deterministic random outcomes
 */

export function generateHash(serverSeed: string, clientSeed: string, nonce: number): string {
  return crypto
    .createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');
}

/**
 * Convert hex hash to a float between 0 and 1
 */
export function hashToFloat(hash: string): number {
  // Take first 8 hex chars (32 bits), convert to integer, divide by max 32-bit value
  const int = parseInt(hash.substring(0, 8), 16);
  return int / 0xFFFFFFFF;
}

/**
 * Get a random integer between min and max (inclusive) from a provably fair hash
 */
export function hashToInt(hash: string, min: number, max: number): number {
  const float = hashToFloat(hash);
  return Math.floor(float * (max - min + 1)) + min;
}

/**
 * Generate multiple random values from a single hash by using different byte offsets
 */
export function hashToMultipleInts(hash: string, count: number, min: number, max: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    // Use different 8-char segments of the 64-char hash, then extend with extra hashing
    const segmentHash = i < 8
      ? hash.substring(i * 8, i * 8 + 8)
      : crypto.createHash('sha256').update(hash + ':' + i).digest('hex').substring(0, 8);
    const int = parseInt(segmentHash, 16);
    results.push(Math.floor((int / 0xFFFFFFFF) * (max - min + 1)) + min);
  }
  return results;
}

/**
 * Verify a provably fair result
 */
export function verifyResult(serverSeed: string, serverSeedHash: string): boolean {
  const computed = crypto.createHash('sha256').update(serverSeed).digest('hex');
  return computed === serverSeedHash;
}

export interface GameResult {
  outcome: any;
  display: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  hash: string;
}

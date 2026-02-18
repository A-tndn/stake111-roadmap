import redisClient from '../db/redis';
import logger from '../config/logger';

/**
 * Redis caching service for high-frequency read operations
 */
class CacheService {
  private isConnected = false;

  constructor() {
    redisClient.on('connect', () => { this.isConnected = true; });
    redisClient.on('error', () => { this.isConnected = false; });
    redisClient.on('end', () => { this.isConnected = false; });
  }

  private get available(): boolean {
    return this.isConnected && redisClient.isOpen;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.available) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.debug(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL in seconds
   */
  async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    if (!this.available) return;
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.debug(`Cache set error for ${key}:`, error);
    }
  }

  /**
   * Delete a cached key
   */
  async del(key: string): Promise<void> {
    if (!this.available) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.debug(`Cache del error for ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.available) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.debug(`Cache delPattern error for ${pattern}:`, error);
    }
  }

  /**
   * Cache-through pattern: get from cache, or compute and cache
   */
  async getOrSet<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const result = await compute();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  // ==================== Domain-specific cache keys ====================

  /**
   * Cache live match data (30 second TTL — frequently updated)
   */
  async cacheMatch(matchId: string, data: any): Promise<void> {
    await this.set(`match:${matchId}`, data, 30);
  }

  async getCachedMatch(matchId: string): Promise<any> {
    return this.get(`match:${matchId}`);
  }

  /**
   * Cache match list (60 second TTL)
   */
  async cacheMatchList(status: string, data: any): Promise<void> {
    await this.set(`matches:${status}`, data, 60);
  }

  async getCachedMatchList(status: string): Promise<any> {
    return this.get(`matches:${status}`);
  }

  /**
   * Cache user balance (10 second TTL — balance changes frequently during betting)
   */
  async cacheUserBalance(userId: string, balance: number): Promise<void> {
    await this.set(`balance:${userId}`, balance, 10);
  }

  async getCachedUserBalance(userId: string): Promise<number | null> {
    return this.get<number>(`balance:${userId}`);
  }

  /**
   * Invalidate user balance cache (after bet/deposit/withdrawal)
   */
  async invalidateUserBalance(userId: string): Promise<void> {
    await this.del(`balance:${userId}`);
  }

  /**
   * Cache odds (15 second TTL)
   */
  async cacheOdds(matchId: string, data: any): Promise<void> {
    await this.set(`odds:${matchId}`, data, 15);
  }

  async getCachedOdds(matchId: string): Promise<any> {
    return this.get(`odds:${matchId}`);
  }

  /**
   * Cache casino game list (5 minute TTL — rarely changes)
   */
  async cacheCasinoGames(data: any): Promise<void> {
    await this.set('casino:games', data, 300);
  }

  async getCachedCasinoGames(): Promise<any> {
    return this.get('casino:games');
  }

  /**
   * Cache analytics data (2 minute TTL)
   */
  async cacheAnalytics(key: string, data: any): Promise<void> {
    await this.set(`analytics:${key}`, data, 120);
  }

  async getCachedAnalytics(key: string): Promise<any> {
    return this.get(`analytics:${key}`);
  }

  /**
   * Rate limit tracking for custom limits
   */
  async checkCustomRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    if (!this.available) return true; // Allow if Redis is down
    try {
      const current = await redisClient.incr(`ratelimit:${key}`);
      if (current === 1) {
        await redisClient.expire(`ratelimit:${key}`, windowSeconds);
      }
      return current <= maxRequests;
    } catch {
      return true;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;

import rateLimit from 'express-rate-limit';

/**
 * Login rate limiter — strict to prevent brute force
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
});

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for financial operations (deposits/withdrawals)
 */
export const financialLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: 'Too many financial requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Betting rate limiter — allow rapid but not abusive betting
 */
export const bettingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, message: 'Too many bets placed, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin operation limiter — generous but prevents automation abuse
 */
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many admin requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoint limiter (register/reset password)
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

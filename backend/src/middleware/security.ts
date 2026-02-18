import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import logger from '../config/logger';

/**
 * Brute force protection using in-memory store (Redis-backed in production)
 * Tracks failed login attempts per IP and locks out after threshold
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION = 15 * 60 * 1000; // 15 minutes

export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  const key = `login:${ip}`;
  const now = Date.now();

  const record = loginAttempts.get(key);

  if (record) {
    // Check if locked out
    if (record.lockedUntil > now) {
      const remainingMs = record.lockedUntil - now;
      const remainingMin = Math.ceil(remainingMs / 60000);
      logger.warn(`Brute force lockout: IP ${ip}, ${remainingMin}m remaining`);
      return errorResponse(res, `Too many failed attempts. Try again in ${remainingMin} minutes.`, 429);
    }

    // Reset if window expired
    if (now - record.lastAttempt > WINDOW_DURATION) {
      loginAttempts.delete(key);
    }
  }

  next();
};

/**
 * Call this after a failed login to increment the counter
 */
export const recordFailedLogin = (ip: string) => {
  const key = `login:${ip}`;
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lastAttempt: now, lockedUntil: 0 };

  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION;
    logger.warn(`IP ${ip} locked out after ${record.count} failed attempts`);
  }

  loginAttempts.set(key, record);
};

/**
 * Call this after a successful login to clear the counter
 */
export const clearFailedLogins = (ip: string) => {
  loginAttempts.delete(`login:${ip}`);
};

/**
 * Request sanitizer — strips potentially dangerous characters from query/params
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string)
          .replace(/[<>]/g, '')
          .trim();
      }
    }
  }

  next();
};

/**
 * Security headers beyond what Helmet provides
 */
export const additionalSecurityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy — disable unnecessary browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Remove server fingerprint
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Request size limiter for specific routes
 */
export const requestSizeLimiter = (maxSizeKb: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > maxSizeKb * 1024) {
      return errorResponse(res, `Request body too large. Maximum ${maxSizeKb}KB allowed.`, 413);
    }
    next();
  };
};

/**
 * IP whitelist middleware for admin routes (optional, configured via env)
 */
export const ipWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const whitelist = process.env.ADMIN_IP_WHITELIST;
  if (!whitelist) return next(); // No whitelist configured, allow all

  const allowedIps = whitelist.split(',').map(ip => ip.trim());
  const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || '';

  if (!allowedIps.includes(clientIp)) {
    logger.warn(`Blocked admin access from IP: ${clientIp}`);
    return errorResponse(res, 'Access denied', 403);
  }

  next();
};

// Cleanup old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (now - record.lastAttempt > WINDOW_DURATION * 2) {
      loginAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000);

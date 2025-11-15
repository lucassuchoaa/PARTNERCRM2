/**
 * Rate Limiting Middleware for Vercel Serverless Functions
 *
 * Implements in-memory rate limiting with configurable limits
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RateLimitInfo } from '../../shared/types';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: In production, consider using Redis or Vercel KV for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier from request (IP address or user ID)
 */
function getClientId(req: VercelRequest): string {
  // Try to get user ID from JWT if available
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.userId) {
        return `user:${payload.userId}`;
      }
    } catch {
      // Fall through to IP-based rate limiting
    }
  }

  // Fall back to IP address
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  return `ip:${Array.isArray(ip) ? ip[0] : ip}`;
}

/**
 * Rate limiting middleware
 *
 * @param limit - Maximum number of requests per window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(limit: number = 60, windowMs: number = 60000) {
  return async (
    req: VercelRequest,
    res: VercelResponse,
    next: () => Promise<void>
  ): Promise<void | VercelResponse> => {
    const clientId = getClientId(req);
    const now = Date.now();
    const resetTime = now + windowMs;

    let entry = rateLimitStore.get(clientId);

    // Create new entry if doesn't exist or reset time has passed
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime
      };
      rateLimitStore.set(clientId, entry);
    }

    entry.count++;

    const rateLimitInfo: RateLimitInfo = {
      limit,
      remaining: Math.max(0, limit - entry.count),
      reset: entry.resetTime
    };

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimitInfo.reset.toString());

    if (entry.count > limit) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        rateLimitInfo,
        timestamp: new Date().toISOString()
      });
    }

    await next();
  };
}

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit(5, 60000); // 5 requests per minute

/**
 * Standard rate limiting for API endpoints
 */
export const apiRateLimit = rateLimit(60, 60000); // 60 requests per minute

/**
 * Generous rate limiting for public endpoints
 */
export const publicRateLimit = rateLimit(100, 60000); // 100 requests per minute

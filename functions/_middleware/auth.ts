/**
 * Authentication Middleware for Vercel Serverless Functions
 *
 * Validates JWT tokens and provides user authentication
 */

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../../shared/types';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('⚠️  JWT_SECRET or JWT_REFRESH_SECRET not set in environment variables');
}

/**
 * Extract JWT token from Authorization header
 */
export function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
}

/**
 * Generate access token (1 hour expiration)
 */
export function generateAccessToken(userId: string, email: string, role: string): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    email,
    role
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h'
  });
}

/**
 * Generate refresh token (7 days expiration)
 */
export function generateRefreshToken(userId: string, email: string, role: string): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    email,
    role
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
}

/**
 * Authentication middleware for protected routes
 */
export function requireAuth(
  handler: (req: VercelRequest, res: VercelResponse, user: JWTPayload) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      const token = extractToken(req);

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No authorization token provided',
          timestamp: new Date().toISOString()
        });
      }

      const user = verifyAccessToken(token);

      // Call the actual handler with authenticated user
      await handler(req, res, user);
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: error.message || 'Authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (
    handler: (req: VercelRequest, res: VercelResponse, user: JWTPayload) => Promise<void>
  ) => {
    return requireAuth(async (req, res, user) => {
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          timestamp: new Date().toISOString()
        });
      }

      await handler(req, res, user);
    });
  };
}

/**
 * Login API Endpoint
 *
 * Authenticates users and returns JWT tokens
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse, errorResponse } from '../_middleware/errorHandler';
import { authRateLimit } from '../_middleware/rateLimit';
import { validateBody, loginSchema } from '../_middleware/validation';
import { generateAccessToken, generateRefreshToken } from '../_middleware/auth';
import { LoginRequest, LoginResponse, User } from '../../shared/types';

// Mock database - In production, replace with actual database
// Passwords should be hashed with bcrypt
const MOCK_USERS: Record<string, User & { password: string }> = {
  'admin@partnerscrm.com': {
    id: '1',
    email: 'admin@partnerscrm.com',
    name: 'Admin User',
    role: 'admin',
    password: '$2b$10$YourHashedPasswordHere', // bcrypt hash
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  },
  'partner@example.com': {
    id: '2',
    email: 'partner@example.com',
    name: 'Partner User',
    role: 'partner',
    password: '$2b$10$YourHashedPasswordHere', // bcrypt hash
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  }
};

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  // Apply rate limiting
  await authRateLimit(req, res, async () => {
    // Validate request body
    await validateBody(loginSchema)(req, res, async (validatedData: LoginRequest) => {
      const { email, password } = validatedData;

      // Find user by email
      const user = MOCK_USERS[email.toLowerCase()];

      if (!user) {
        return errorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        return errorResponse('Account is inactive', 401, 'ACCOUNT_INACTIVE');
      }

      // Verify password
      // For development, also accept plain text "password123"
      const isPasswordValid =
        password === 'password123' || // Development fallback
        await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return errorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id, user.email, user.role);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      const response: LoginResponse = {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour in seconds
      };

      res.status(200).json(successResponse(response, 'Login successful'));
    });
  });
}

export default withCORS(withErrorHandler(handler));

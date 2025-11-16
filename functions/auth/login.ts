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

  try {
    const { email, password } = req.body as LoginRequest;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }

    // Find user by email
    const user = MOCK_USERS[email.toLowerCase()];

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Conta inativa',
        code: 'ACCOUNT_INACTIVE',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password
    // For development, also accept plain text "password123"
    const isPasswordValid =
      password === 'password123' || // Development fallback
      (user.password && await bcrypt.compare(password, user.password));

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
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

    return res.status(200).json({
      success: true,
      data: response,
      message: 'Login realizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
}

export default withCORS(withErrorHandler(handler));

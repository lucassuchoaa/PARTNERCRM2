import { Request, Response, NextFunction } from 'express';
import { query } from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    profileImageUrl: string | null;
  };
}

// Helper to verify token - same as in auth.ts
function verifyToken(token: string): { userId: string; timestamp: number; type: string } | null {
  if (!token) return null;

  // Parse token format: <type>_<base64(userId)>_<timestamp>
  const parts = token.split('_');
  if (parts.length < 3) return null;

  const type = parts[0];
  const timestamp = parseInt(parts[parts.length - 1], 10);
  const encodedUserId = parts.slice(1, -1).join('_');

  if (!type || !encodedUserId || isNaN(timestamp)) return null;

  try {
    const userId = Buffer.from(encodedUserId, 'base64url').toString('utf8');
    return { userId, timestamp, type };
  } catch {
    return null;
  }
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
        code: 'NO_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Check token expiration (1 hour = 3600000ms)
    const now = Date.now();
    if (now - decoded.timestamp > 3600000) {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
    }

    // Find user in database
    const result = await query(
      'SELECT id, email, name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: null,
      lastName: null,
      role: user.role,
      profileImageUrl: null
    };

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
}

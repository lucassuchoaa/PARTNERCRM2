import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';

const router = Router();

// Helper to create token (format: access_<base64(userId)>_<timestamp>)
function createToken(type: 'access' | 'refresh', userId: string): string {
  const timestamp = Date.now();
  const encodedUserId = Buffer.from(userId).toString('base64url');
  return `${type}_${encodedUserId}_${timestamp}`;
}

// Helper to verify token
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

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
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
    const result = await pool.query(
      `SELECT id, email, name, first_name, last_name, role, status,
              profile_image_url, created_at, updated_at
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        isActive: user.status === 'active',
        profileImageUrl: user.profile_image_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token não fornecido',
        code: 'NO_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    const decoded = verifyToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Check refresh token expiration (7 days = 604800000ms)
    const now = Date.now();
    if (now - decoded.timestamp > 604800000) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token expirado',
        code: 'REFRESH_TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
    }

    // Find user in database
    const result = await pool.query(
      'SELECT id, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || result.rows[0].status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Usuário inválido ou inativo',
        code: 'INVALID_USER',
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];

    // Generate new tokens
    const newAccessToken = createToken('access', user.id);
    const newRefreshToken = createToken('refresh', user.id);

    console.log('✅ Tokens refreshed for user:', user.id);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }

    // Buscar usuário no banco de dados
    const result = await pool.query(
      `SELECT id, email, name, first_name, last_name, password, role, status,
              profile_image_url, created_at, updated_at
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      console.error('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Conta inativa',
        code: 'ACCOUNT_INACTIVE',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.error('❌ Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Password verified successfully');
    console.log('📋 User data:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Gerar tokens
    const accessToken = createToken('access', user.id);
    const refreshToken = createToken('refresh', user.id);

    // Atualizar last_login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    console.log('✅ Tokens generated for role:', user.role);

    // Retornar usuário sem senha
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      isActive: user.status === 'active',
      profileImageUrl: user.profile_image_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    return res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: 3600
      },
      message: 'Login realizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

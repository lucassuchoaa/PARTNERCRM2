import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';

// Generate UUID without crypto import
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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

    // Verificar status da conta
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        error: 'Sua conta está aguardando aprovação do administrador. Você receberá um email quando sua conta for aprovada.',
        code: 'ACCOUNT_PENDING',
        timestamp: new Date().toISOString()
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: 'Sua conta foi desativada. Entre em contato com o administrador.',
        code: 'ACCOUNT_INACTIVE',
        timestamp: new Date().toISOString()
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Sua conta não está ativa. Entre em contato com o administrador.',
        code: 'ACCOUNT_NOT_ACTIVE',
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

// POST /api/auth/register - Registro público para parceiros
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('📝 Registration attempt for:', email);

    // Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e senha são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido',
        timestamp: new Date().toISOString()
      });
    }

    // Validar tamanho da senha
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A senha deve ter no mínimo 6 caracteres',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se email já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Este email já está cadastrado',
        code: 'EMAIL_EXISTS',
        timestamp: new Date().toISOString()
      });
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Gerar ID único
    const newId = generateUUID();

    // Criar usuário como parceiro pendente de aprovação
    const result = await pool.query(
      `INSERT INTO users (id, email, name, password, role, status, permissions)
       VALUES ($1, $2, $3, $4, 'partner', 'pending', $5)
       RETURNING id, email, name, role, status, created_at, updated_at`,
      [newId, email.toLowerCase(), name, hashedPassword, []]
    );

    const newUser = result.rows[0];

    console.log('✅ User registered successfully:', newUser.email, 'as partner (pending approval)');

    // Retornar usuário criado (sem tokens, pois precisa de aprovação)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status,
      isActive: false,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };

    return res.status(201).json({
      success: true,
      data: {
        user: userResponse
      },
      message: 'Cadastro realizado com sucesso! Sua conta está aguardando aprovação do administrador.',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      details: error.code || error.detail || 'No details',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

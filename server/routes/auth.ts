import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { createToken, verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { loginSchema, refreshTokenSchema, createUserSchema } from '../utils/validation';
import { authLimiter } from '../middleware/rateLimiter';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/auth/login
 * Login com email e senha
 * Rate limited: 5 tentativas por 15 minutos
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    // Validar input
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    console.log(`[AUTH] Tentativa de login para: ${email}`);

    // Buscar usuário no banco
    const result = await pool.query(
      `SELECT id, email, name, first_name, last_name, role, status, password
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      console.warn(`[AUTH] ⚠️  Login falhou: usuário não encontrado (${email})`);

      // Não revelar se email existe ou não (segurança)
      return res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Verificar se usuário está ativo
    if (user.status !== 'active') {
      console.warn(`[AUTH] ⚠️  Login falhou: usuário inativo (${email})`);

      return res.status(403).json({
        success: false,
        error: 'Conta inativa. Entre em contato com o administrador.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verificar senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.warn(`[AUTH] ⚠️  Login falhou: senha incorreta (${email})`);

      return res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Login bem-sucedido! Gerar tokens JWT
    const accessToken = createToken('access', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = createToken('refresh', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Atualizar last_login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    console.log(`[AUTH] ✅ Login bem-sucedido: ${email} (role: ${user.role})`);

    // Retornar tokens e dados do usuário (SEM senha)
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.first_name,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hora em segundos
      }
    });

  } catch (error: any) {
    // Erro de validação Zod
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    console.error('[AUTH] ❌ Erro no login:', error);

    res.status(500).json({
      success: false,
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validar input
    const validated = refreshTokenSchema.parse(req.body);
    const { refreshToken } = validated;

    // Verificar refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken, 'refresh');
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: error.message,
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Buscar usuário atualizado no banco
    const result = await pool.query(
      'SELECT id, email, name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || result.rows[0].status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Usuário inválido ou inativo',
        code: 'INVALID_USER'
      });
    }

    const user = result.rows[0];

    // Gerar novo access token
    const newAccessToken = createToken('access', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    console.log(`[AUTH] 🔄 Token renovado para: ${user.email}`);

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      tokens: {
        accessToken: newAccessToken,
        refreshToken, // Manter mesmo refresh token
        expiresIn: 3600
      }
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR'
      });
    }

    console.error('[AUTH] ❌ Erro no refresh:', error);

    res.status(500).json({
      success: false,
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Extrair token do header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar token
    let decoded;
    try {
      decoded = verifyToken(token, 'access');
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: error.message,
        code: 'INVALID_TOKEN'
      });
    }

    // Buscar usuário no banco
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
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.first_name,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        profileImageUrl: user.profile_image_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error: any) {
    console.error('[AUTH] ❌ Erro no /me:', error);

    res.status(500).json({
      success: false,
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/register
 * Registro público para novos usuários (role: partner)
 * Rate limited
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    // Validar input
    const validated = createUserSchema.parse({
      ...req.body,
      role: 'partner' // Força role como partner para registro público
    });

    const { email, name, password } = validated;

    // Verificar se email já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash da senha com bcrypt (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const userId = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO users (id, email, name, password, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, email, name, role, status, created_at`,
      [userId, email, name, hashedPassword, 'partner', 'active']
    );

    const user = result.rows[0];

    console.log(`[AUTH] ✅ Novo usuário registrado: ${email}`);

    // Auto-login: gerar tokens
    const accessToken = createToken('access', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = createToken('refresh', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.created_at
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600
      }
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    console.error('[AUTH] ❌ Erro no registro:', error);

    res.status(500).json({
      success: false,
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (invalidação de token no futuro com blacklist)
 */
router.post('/logout', async (req: Request, res: Response) => {
  // TODO: Implementar blacklist de tokens se necessário
  // Por enquanto, apenas confirma logout (cliente deve deletar tokens)

  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

export default router;

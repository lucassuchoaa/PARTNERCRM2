import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('[AUTH] Login attempt:', { email, passwordProvided: !!password });
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    console.log('[AUTH] User found:', result.rows.length > 0 ? 'YES' : 'NO');
    
    if (result.rows.length === 0) {
      console.log('[AUTH] User not found for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }
    
    const user = result.rows[0];
    console.log('[AUTH] User status:', user.status);
    console.log('[AUTH] Password hash exists:', !!user.password);
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Conta inativa',
        code: 'ACCOUNT_INACTIVE',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verificar hash bcrypt
    let isPasswordValid = false;
    
    if (user.password) {
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('[AUTH] Password valid:', isPasswordValid);
    } else {
      console.log('[AUTH] No password hash in database');
    }
    
    if (!isPasswordValid) {
      console.log('[AUTH] Password validation failed');
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }
    
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);
    
    const { password: _, ...userWithoutPassword } = user;
    
    return res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      },
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
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token é obrigatório',
        timestamp: new Date().toISOString()
      });
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0 || result.rows[0].status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Usuário inválido ou inativo',
        timestamp: new Date().toISOString()
      });
    }
    
    const user = result.rows[0];
    const newAccessToken = generateAccessToken(user.id, user.email, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.email, user.role);
    
    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      },
      message: 'Token atualizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      error: error.message || 'Token inválido',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, status, created_at, last_login, permissions FROM users WHERE id = $1',
      [req.user!.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

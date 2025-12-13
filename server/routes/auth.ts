import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

// Mock users for development (same as in /api/auth/login.js)
const MOCK_USERS = {
  'admin@partnerscrm.com': {
    id: '1',
    email: 'admin@partnerscrm.com',
    name: 'Admin User',
    role: 'admin',
    password: 'password123',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  'partner@example.com': {
    id: '2',
    email: 'partner@example.com',
    name: 'Partner User',
    role: 'partner',
    password: 'password123',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
};

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

    // Buscar usuário (usando mock users por enquanto)
    const user = MOCK_USERS[email.toLowerCase() as keyof typeof MOCK_USERS];

    if (!user) {
      console.error('❌ User not found:', email);
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

    // Verificar senha (comparação simples para desenvolvimento)
    if (user.password !== password) {
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

    // Gerar tokens simples (em produção, usar JWT real)
    const timestamp = Date.now();
    const accessToken = `access_${user.id}_${timestamp}`;
    const refreshToken = `refresh_${user.id}_${timestamp}`;

    console.log('✅ Tokens generated for role:', user.role);

    // Remover senha do retorno
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
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

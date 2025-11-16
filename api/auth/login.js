/**
 * Login API Endpoint para Vercel Serverless Functions
 *
 * IMPORTANTE: Vercel espera arquivos .js na pasta /api/ para serverless functions
 */

// Mock de usuários - em produção, usar banco de dados real
const MOCK_USERS = {
  'admin@partnerscrm.com': {
    id: '1',
    email: 'admin@partnerscrm.com',
    name: 'Admin User',
    role: 'manager',
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

export default async function handler(req, res) {
  // Configurar CORS
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        timestamp: new Date().toISOString()
      });
    }

    // Buscar usuário
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

    // Verificar senha
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Gerar tokens simples (em produção, usar JWT real)
    const timestamp = Date.now();
    const accessToken = `access_${user.id}_${timestamp}`;
    const refreshToken = `refresh_${user.id}_${timestamp}`;

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
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
}

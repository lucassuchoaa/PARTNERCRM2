/**
 * Users API - Versão Mock (sem Supabase)
 * Para produção com Supabase real, renomeie index.js para index-supabase.js
 * e este arquivo para index.js
 */

// Mock database in-memory
let mockUsers = [
  {
    id: '1',
    email: 'admin@partnerscrm.com',
    name: 'Admin User',
    role: 'manager',
    status: 'active',
    managerId: null,
    remunerationTableIds: [1, 2],
    createdAt: '2025-01-01T00:00:00.000Z',
    lastLogin: '2025-11-16T00:00:00.000Z',
    permissions: ['manage_users', 'view_reports']
  },
  {
    id: '2',
    email: 'partner@example.com',
    name: 'Partner User',
    role: 'partner',
    status: 'active',
    managerId: '1',
    remunerationTableIds: [1],
    createdAt: '2025-01-02T00:00:00.000Z',
    lastLogin: '2025-11-15T00:00:00.000Z',
    permissions: ['view_own_data']
  }
];

export default async function handler(req, res) {
  // CORS
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Listar usuários
      return res.status(200).json(mockUsers);
    }

    if (req.method === 'POST') {
      // Criar usuário
      const { email, name, password, role, managerId, remunerationTableIds, status = 'active' } = req.body;

      if (!email || !name || !password || !role) {
        return res.status(400).json({
          success: false,
          error: 'Email, nome, senha e role são obrigatórios'
        });
      }

      // Verificar email duplicado
      const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email já cadastrado'
        });
      }

      const newUser = {
        id: (mockUsers.length + 1).toString(),
        email: email.toLowerCase().trim(),
        name,
        role,
        status,
        managerId: managerId || null,
        remunerationTableIds: remunerationTableIds || [],
        createdAt: new Date().toISOString(),
        lastLogin: null,
        permissions: role === 'manager' ? ['manage_users', 'view_reports'] : ['view_own_data']
      };

      mockUsers.push(newUser);

      return res.status(201).json({
        success: true,
        data: newUser
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

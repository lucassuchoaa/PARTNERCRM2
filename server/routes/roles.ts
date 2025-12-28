import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Permissões disponíveis no sistema
export const AVAILABLE_PERMISSIONS = {
  // Dashboard
  'dashboard.view': 'Visualizar Dashboard',
  'dashboard.analytics': 'Ver Analytics Avançados',

  // Clientes
  'clients.view': 'Visualizar Clientes',
  'clients.create': 'Criar Clientes',
  'clients.edit': 'Editar Clientes',
  'clients.delete': 'Excluir Clientes',

  // Indicações/Prospects
  'referrals.view': 'Visualizar Indicações',
  'referrals.create': 'Criar Indicações',
  'referrals.validate': 'Validar Indicações',
  'referrals.approve': 'Aprovar/Rejeitar Indicações',

  // Relatórios
  'reports.view': 'Visualizar Relatórios',
  'reports.export': 'Exportar Relatórios',
  'reports.all_partners': 'Ver Relatórios de Todos Parceiros',

  // Material de Apoio
  'support.view': 'Visualizar Material de Apoio',
  'support.manage': 'Gerenciar Material de Apoio',

  // Administração
  'admin.access': 'Acessar Painel Admin',
  'admin.users': 'Gerenciar Usuários',
  'admin.roles': 'Gerenciar Funções',
  'admin.products': 'Gerenciar Produtos',
  'admin.pricing': 'Gerenciar Preços',
  'admin.notifications': 'Enviar Notificações',
  'admin.integrations': 'Configurar Integrações',
  'admin.files': 'Gerenciar Arquivos',

  // Comissões
  'commissions.view': 'Visualizar Comissões',
  'commissions.manage': 'Gerenciar Tabelas de Comissão',

  // ChatBot
  'chatbot.view': 'Ver ChatBot Analytics',
  'chatbot.train': 'Treinar ChatBot'
};

// GET - Listar todas as funções
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, permissions, is_system, is_active, created_at, updated_at
      FROM roles
      ORDER BY is_system DESC, name ASC
    `);

    return res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar funções',
      timestamp: new Date().toISOString()
    });
  }
});

// GET - Listar permissões disponíveis
router.get('/permissions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const permissions = Object.entries(AVAILABLE_PERMISSIONS).map(([key, label]) => ({
      key,
      label,
      category: key.split('.')[0]
    }));

    // Agrupar por categoria
    const grouped = permissions.reduce((acc: any, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        permissions,
        grouped
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar permissões',
      timestamp: new Date().toISOString()
    });
  }
});

// GET - Buscar função por ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Função não encontrada',
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching role:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar função',
      timestamp: new Date().toISOString()
    });
  }
});

// POST - Criar nova função
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, permissions } = req.body;

    console.log('🎭 Creating new role');
    console.log('🎭 Name:', name);
    console.log('🎭 Description:', description);
    console.log('🎭 Permissions:', permissions);

    if (!name) {
      console.error('❌ Nome da função não fornecido');
      return res.status(400).json({
        success: false,
        error: 'Nome da função é obrigatório',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se já existe
    const existing = await pool.query(
      'SELECT id FROM roles WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existing.rows.length > 0) {
      console.error('❌ Função já existe:', name);
      return res.status(409).json({
        success: false,
        error: 'Já existe uma função com este nome',
        timestamp: new Date().toISOString()
      });
    }

    console.log('💾 Inserindo role no banco de dados...');
    const result = await pool.query(`
      INSERT INTO roles (name, description, permissions, is_system, is_active)
      VALUES ($1, $2, $3, false, true)
      RETURNING *
    `, [name, description || '', JSON.stringify(permissions || [])]);

    console.log('✅ Role criada com sucesso:', result.rows[0]);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Função criada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error creating role:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar função',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT - Atualizar função
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isActive } = req.body;

    // Verificar se é função do sistema
    const roleCheck = await pool.query(
      'SELECT is_system FROM roles WHERE id = $1',
      [id]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Função não encontrada',
        timestamp: new Date().toISOString()
      });
    }

    // Funções do sistema só podem ter permissões alteradas
    const isSystem = roleCheck.rows[0].is_system;

    const result = await pool.query(`
      UPDATE roles SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        permissions = COALESCE($3, permissions),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [
      isSystem ? null : name, // Não permite mudar nome de função do sistema
      description,
      permissions ? JSON.stringify(permissions) : null,
      isActive,
      id
    ]);

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Função atualizada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error updating role:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar função',
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE - Excluir função
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se é função do sistema
    const roleCheck = await pool.query(
      'SELECT is_system, name FROM roles WHERE id = $1',
      [id]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Função não encontrada',
        timestamp: new Date().toISOString()
      });
    }

    if (roleCheck.rows[0].is_system) {
      return res.status(403).json({
        success: false,
        error: 'Funções do sistema não podem ser excluídas',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se há usuários com esta função
    const usersWithRole = await pool.query(
      'SELECT COUNT(*) FROM users WHERE role = $1',
      [roleCheck.rows[0].name.toLowerCase()]
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir função com usuários vinculados',
        timestamp: new Date().toISOString()
      });
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Função excluída com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao excluir função',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

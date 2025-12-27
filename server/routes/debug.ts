import { Router, Request, Response } from 'express';
import { pool, query } from '../db';

const router = Router();

// Debug endpoint - NÃO USAR EM PRODUÇÃO FINAL
router.get('/db-info', async (req: Request, res: Response) => {
  try {
    // Informações sobre o banco
    const dbUrl = process.env.DATABASE_URL?.substring(0, 50) + '...';

    // Total de roles
    const rolesCount = await query('SELECT COUNT(*) as total FROM roles');

    // Listar roles
    const rolesList = await query(`
      SELECT id, name, is_system, is_active,
             jsonb_array_length(permissions) as num_permissions
      FROM roles
      ORDER BY is_system DESC, name ASC
    `);

    // Informações do pool
    const poolInfo = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    return res.json({
      success: true,
      data: {
        database: {
          url: dbUrl,
          isNeon: process.env.DATABASE_URL?.includes('neon.tech'),
          environment: process.env.NODE_ENV
        },
        pool: poolInfo,
        roles: {
          total: rolesCount.rows[0].total,
          list: rolesList.rows
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para garantir roles padrão
router.post('/ensure-default-roles', async (req: Request, res: Response) => {
  try {
    const defaultRoles = [
      {
        id: 'role_admin',
        name: 'Administrador',
        description: 'Acesso total ao sistema com todas as permissões',
        permissions: JSON.stringify([
          "dashboard.view","dashboard.analytics","clients.view","clients.create",
          "clients.edit","clients.delete","referrals.view","referrals.create",
          "referrals.validate","referrals.approve","reports.view","reports.export",
          "reports.all_partners","support.view","support.manage","admin.access",
          "admin.users","admin.roles","admin.products","admin.pricing",
          "admin.notifications","admin.integrations","admin.files",
          "commissions.view","commissions.manage","chatbot.view","chatbot.train"
        ])
      },
      {
        id: 'role_manager',
        name: 'Gerente',
        description: 'Gerente de parceiros com permissões de supervisão',
        permissions: JSON.stringify([
          "dashboard.view","dashboard.analytics","clients.view","clients.create",
          "clients.edit","referrals.view","referrals.create","referrals.validate",
          "reports.view","reports.export","reports.all_partners","support.view",
          "commissions.view","chatbot.view"
        ])
      },
      {
        id: 'role_partner',
        name: 'Parceiro',
        description: 'Parceiro padrão com permissões básicas',
        permissions: JSON.stringify([
          "dashboard.view","clients.view","referrals.view","referrals.create",
          "reports.view","support.view","commissions.view","chatbot.view"
        ])
      }
    ];

    const results = [];

    for (const role of defaultRoles) {
      // Verificar se já existe
      const existing = await query('SELECT id FROM roles WHERE id = $1', [role.id]);

      if (existing.rows.length === 0) {
        // Inserir
        await query(`
          INSERT INTO roles (id, name, description, permissions, is_system, is_active)
          VALUES ($1, $2, $3, $4::jsonb, true, true)
        `, [role.id, role.name, role.description, role.permissions]);

        results.push({ role: role.name, action: 'inserted' });
      } else {
        // Atualizar
        await query(`
          UPDATE roles
          SET name = $2, description = $3, permissions = $4::jsonb, is_system = true, is_active = true
          WHERE id = $1
        `, [role.id, role.name, role.description, role.permissions]);

        results.push({ role: role.name, action: 'updated' });
      }
    }

    // Listar roles após garantir
    const finalRoles = await query(`
      SELECT id, name, is_system, jsonb_array_length(permissions) as num_permissions
      FROM roles
      ORDER BY is_system DESC, name ASC
    `);

    return res.json({
      success: true,
      data: {
        results,
        currentRoles: finalRoles.rows
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Ensure roles error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

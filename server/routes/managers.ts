import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';

const router = Router();

// GET - Listar todos os gerentes com seus parceiros
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Managers] Buscando gerentes...');

    // Buscar todos os usuários com role='manager' (case insensitive)
    const managersResult = await pool.query(`
      SELECT
        id,
        email,
        name,
        role,
        status,
        created_at as "createdAt"
      FROM users
      WHERE LOWER(TRIM(role)) = 'manager'
      ORDER BY name ASC
    `);

    console.log('[Managers] Encontrados:', managersResult.rows.length, 'gerentes');

    // Para cada gerente, buscar seus parceiros
    const managersWithPartners = await Promise.all(
      managersResult.rows.map(async (manager) => {
        const partnersResult = await pool.query(`
          SELECT id, name, email
          FROM users
          WHERE manager_id = $1 AND role = 'partner' AND status = 'active'
          ORDER BY name ASC
        `, [manager.id]);

        return {
          ...manager,
          partnersIds: partnersResult.rows.map(p => p.id),
          partners: partnersResult.rows
        };
      })
    );

    res.json(managersWithPartners);
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ error: 'Erro ao buscar gerentes' });
  }
});

// GET - Debug: Listar todos os roles existentes
router.get('/debug/roles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rolesResult = await pool.query(`
      SELECT DISTINCT role, status, COUNT(*) as count
      FROM users
      GROUP BY role, status
      ORDER BY role
    `);

    const usersWithManager = await pool.query(`
      SELECT id, name, email, role, status
      FROM users
      WHERE LOWER(role) LIKE '%manager%' OR LOWER(role) LIKE '%gerente%'
    `);

    res.json({
      roles: rolesResult.rows,
      potentialManagers: usersWithManager.rows
    });
  } catch (error) {
    console.error('Error fetching debug info:', error);
    res.status(500).json({ error: 'Erro ao buscar informações de debug' });
  }
});

// GET - Buscar gerente específico
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const managerResult = await pool.query(`
      SELECT
        id,
        email,
        name,
        role,
        created_at as "createdAt"
      FROM users
      WHERE id = $1 AND role = 'manager'
    `, [id]);

    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gerente não encontrado' });
    }

    // Buscar parceiros do gerente
    const partnersResult = await pool.query(`
      SELECT id, name, email
      FROM users
      WHERE manager_id = $1 AND role = 'partner' AND status = 'active'
      ORDER BY name ASC
    `, [id]);

    const manager = {
      ...managerResult.rows[0],
      partnersIds: partnersResult.rows.map(p => p.id),
      partners: partnersResult.rows
    };

    res.json(manager);
  } catch (error) {
    console.error('Error fetching manager:', error);
    res.status(500).json({ error: 'Erro ao buscar gerente' });
  }
});

// POST - Criar entrada de gerente (cria usuário com role='manager')
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, email, role, partnersIds } = req.body;

    // Verificar se o usuário existe e tem role='manager'
    const userResult = await pool.query(`
      SELECT id, name, email, role
      FROM users
      WHERE id = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];

    if (user.role !== 'manager') {
      return res.status(400).json({ error: 'Usuário não é um gerente' });
    }

    // Se partnersIds foi fornecido, atualizar os parceiros
    if (partnersIds && Array.isArray(partnersIds)) {
      // Atualizar manager_id de todos os parceiros fornecidos
      if (partnersIds.length > 0) {
        await pool.query(`
          UPDATE users
          SET manager_id = $1
          WHERE id = ANY($2) AND role = 'partner'
        `, [id, partnersIds]);
      }
    }

    // Buscar parceiros atualizados
    const partnersResult = await pool.query(`
      SELECT id, name, email
      FROM users
      WHERE manager_id = $1 AND role = 'partner' AND status = 'active'
      ORDER BY name ASC
    `, [id]);

    const manager = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      partnersIds: partnersResult.rows.map(p => p.id),
      partners: partnersResult.rows
    };

    res.status(201).json(manager);
  } catch (error) {
    console.error('Error creating manager entry:', error);
    res.status(500).json({ error: 'Erro ao criar entrada de gerente' });
  }
});

// PUT - Atualizar gerente (atualizar lista de parceiros)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { partnersIds } = req.body;

    // Verificar se o gerente existe
    const managerResult = await pool.query(`
      SELECT id, name, email, role
      FROM users
      WHERE id = $1 AND role = 'manager'
    `, [id]);

    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gerente não encontrado' });
    }

    // Primeiro, remover este gerente de todos os parceiros
    await pool.query(`
      UPDATE users
      SET manager_id = NULL
      WHERE manager_id = $1 AND role = 'partner'
    `, [id]);

    // Depois, atualizar os parceiros fornecidos
    if (partnersIds && Array.isArray(partnersIds) && partnersIds.length > 0) {
      await pool.query(`
        UPDATE users
        SET manager_id = $1
        WHERE id = ANY($2) AND role = 'partner'
      `, [id, partnersIds]);
    }

    // Buscar parceiros atualizados
    const partnersResult = await pool.query(`
      SELECT id, name, email
      FROM users
      WHERE manager_id = $1 AND role = 'partner' AND status = 'active'
      ORDER BY name ASC
    `, [id]);

    const manager = {
      ...managerResult.rows[0],
      partnersIds: partnersResult.rows.map(p => p.id),
      partners: partnersResult.rows
    };

    res.json(manager);
  } catch (error) {
    console.error('Error updating manager:', error);
    res.status(500).json({ error: 'Erro ao atualizar gerente' });
  }
});

// DELETE - Remover gerente (não deleta o usuário, apenas remove associações)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Remover este gerente de todos os parceiros
    await pool.query(`
      UPDATE users
      SET manager_id = NULL
      WHERE manager_id = $1 AND role = 'partner'
    `, [id]);

    res.json({
      success: true,
      message: 'Associações de gerente removidas com sucesso'
    });
  } catch (error) {
    console.error('Error deleting manager associations:', error);
    res.status(500).json({ error: 'Erro ao remover associações de gerente' });
  }
});

export default router;

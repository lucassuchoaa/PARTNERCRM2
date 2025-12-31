import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET - Listar todos os parceiros
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.manager_id as "managerId",
        u.created_at as "createdAt",
        u.status,
        u.phone,
        u.company,
        u.cnpj,
        u.address,
        u.bank_name,
        u.bank_agency,
        u.bank_account,
        u.bank_account_type,
        u.pix_key,
        m.name as "managerName"
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.role = 'partner'
    `;

    const queryParams: any[] = [];

    // Filtrar por role do usuário autenticado
    if (userRole === 'manager') {
      // Gerente vê apenas parceiros vinculados a ele
      query += ` AND u.manager_id = $1`;
      queryParams.push(userId);
    } else if (userRole === 'partner') {
      // Parceiro vê apenas a si mesmo
      query += ` AND u.id = $1`;
      queryParams.push(userId);
    }
    // Admin vê todos (sem filtro adicional)

    query += ` ORDER BY u.name ASC`;

    const result = await pool.query(query, queryParams);

    // Transformar dados para o formato esperado pelo frontend
    const transformedData = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      managerId: row.managerId,
      managerName: row.managerName,
      createdAt: row.createdAt,
      status: row.status,
      company: row.company || row.cnpj ? {
        name: row.company || '',
        cnpj: row.cnpj || '',
        address: row.address || '',
        phone: row.phone || ''
      } : undefined,
      bankData: row.bank_name ? {
        bank: row.bank_name,
        agency: row.bank_agency || '',
        account: row.bank_account || '',
        accountType: row.bank_account_type || '',
        pix: row.pix_key || ''
      } : undefined
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Erro ao buscar parceiros' });
  }
});

// GET - Buscar parceiro específico
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.manager_id as "managerId",
        u.created_at as "createdAt",
        u.status,
        u.phone,
        u.company,
        u.cnpj,
        u.address,
        u.bank_name,
        u.bank_agency,
        u.bank_account,
        u.bank_account_type,
        u.pix_key,
        m.name as "managerName"
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.id = $1 AND u.role = 'partner'
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parceiro não encontrado' });
    }

    const row = result.rows[0];
    const transformedData = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      managerId: row.managerId,
      managerName: row.managerName,
      createdAt: row.createdAt,
      status: row.status,
      company: row.company || row.cnpj ? {
        name: row.company || '',
        cnpj: row.cnpj || '',
        address: row.address || '',
        phone: row.phone || ''
      } : undefined,
      bankData: row.bank_name ? {
        bank: row.bank_name,
        agency: row.bank_agency || '',
        account: row.bank_account || '',
        accountType: row.bank_account_type || '',
        pix: row.pix_key || ''
      } : undefined
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({ error: 'Erro ao buscar parceiro' });
  }
});

// POST - Criar entrada de parceiro
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, email, managerId } = req.body;

    // Verificar se o usuário existe
    const userResult = await pool.query(`
      SELECT id, name, email, role, manager_id
      FROM users
      WHERE id = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];

    if (user.role !== 'partner') {
      return res.status(400).json({ error: 'Usuário não é um parceiro' });
    }

    // Se managerId foi fornecido e é diferente do atual, atualizar
    if (managerId && managerId !== user.manager_id) {
      await pool.query(`
        UPDATE users
        SET manager_id = $1
        WHERE id = $2
      `, [managerId, id]);
    }

    // Retornar dados do parceiro
    const updatedUser = await pool.query(`
      SELECT
        id,
        email,
        name,
        role,
        manager_id as "managerId",
        created_at as "createdAt",
        status
      FROM users
      WHERE id = $1
    `, [id]);

    res.status(201).json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error creating partner entry:', error);
    res.status(500).json({ error: 'Erro ao criar entrada de parceiro' });
  }
});

// PUT - Atualizar parceiro
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { managerId, status } = req.body;

    // Verificar se o parceiro existe
    const partnerResult = await pool.query(`
      SELECT id, name, email, role
      FROM users
      WHERE id = $1 AND role = 'partner'
    `, [id]);

    if (partnerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parceiro não encontrado' });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (managerId !== undefined) {
      updates.push(`manager_id = $${paramIndex++}`);
      values.push(managerId);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);

    await pool.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, values);

    // Retornar dados atualizados
    const updatedPartner = await pool.query(`
      SELECT
        id,
        email,
        name,
        role,
        manager_id as "managerId",
        created_at as "createdAt",
        status
      FROM users
      WHERE id = $1
    `, [id]);

    res.json(updatedPartner.rows[0]);
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ error: 'Erro ao atualizar parceiro' });
  }
});

// DELETE - Remover parceiro (apenas remove associações, não deleta o usuário)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Remover associação com gerente
    await pool.query(`
      UPDATE users
      SET manager_id = NULL
      WHERE id = $1 AND role = 'partner'
    `, [id]);

    res.json({
      success: true,
      message: 'Associações de parceiro removidas com sucesso'
    });
  } catch (error) {
    console.error('Error deleting partner associations:', error);
    res.status(500).json({ error: 'Erro ao remover associações de parceiro' });
  }
});

export default router;

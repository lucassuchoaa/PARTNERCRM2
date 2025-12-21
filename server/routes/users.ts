import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, status, manager_id, created_at, last_login, permissions FROM users ORDER BY created_at DESC'
    );
    
    return res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuários',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT id, email, name, role, status, manager_id, created_at, last_login, permissions FROM users WHERE id = $1',
      [id]
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
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuário',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, password, role, managerId, permissions } = req.body;
    
    if (!email || !name || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: email, name, password, role',
        timestamp: new Date().toISOString()
      });
    }
    
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email já cadastrado',
        timestamp: new Date().toISOString()
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await query(
      `INSERT INTO users (id, email, name, password, role, manager_id, permissions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, email, name, role, status, manager_id, created_at, permissions`,
      [userId, email.toLowerCase(), name, hashedPassword, role, managerId || null, permissions || []]
    );
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Usuário criado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar usuário',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, status, managerId, permissions } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           status = COALESCE($3, status),
           manager_id = COALESCE($4, manager_id),
           permissions = COALESCE($5, permissions)
       WHERE id = $6
       RETURNING id, email, name, role, status, manager_id, created_at, last_login, permissions`,
      [name, role, status, managerId, permissions, id]
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
      message: 'Usuário atualizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar usuário',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
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
      message: 'Usuário deletado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao deletar usuário',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

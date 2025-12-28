import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, role_id, status, manager_id, created_at, last_login, permissions, phone, company, first_name, last_name, profile_image_url FROM users ORDER BY created_at DESC'
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
      'SELECT id, email, name, role, role_id, status, manager_id, created_at, last_login, permissions, phone, company, first_name, last_name, profile_image_url FROM users WHERE id = $1',
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
    const { email, name, password, role, roleId, managerId, permissions } = req.body;

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
      `INSERT INTO users (id, email, name, password, role, role_id, manager_id, permissions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING id, email, name, role, role_id, status, manager_id, created_at, permissions`,
      [userId, email.toLowerCase(), name, hashedPassword, role, roleId || null, managerId || null, permissions || []]
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
    const { name, role, roleId, status, managerId, permissions, phone, company, firstName, lastName, profileImageUrl } = req.body;

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           role_id = COALESCE($3, role_id),
           status = COALESCE($4, status),
           manager_id = COALESCE($5, manager_id),
           permissions = COALESCE($6, permissions),
           phone = COALESCE($7, phone),
           company = COALESCE($8, company),
           first_name = COALESCE($9, first_name),
           last_name = COALESCE($10, last_name),
           profile_image_url = COALESCE($11, profile_image_url),
           updated_at = NOW()
       WHERE id = $12
       RETURNING id, email, name, role, role_id, status, manager_id, created_at, last_login, permissions, phone, company, first_name, last_name, profile_image_url`,
      [name, role, roleId, status, managerId, permissions, phone, company, firstName, lastName, profileImageUrl, id]
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

router.put('/:id/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual e nova senha são obrigatórias',
        timestamp: new Date().toISOString()
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A nova senha deve ter no mínimo 6 caracteres',
        timestamp: new Date().toISOString()
      });
    }

    // Buscar usuário com senha
    const userResult = await query(
      'SELECT id, password FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
        timestamp: new Date().toISOString()
      });
    }

    const user = userResult.rows[0];

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Senha atual incorreta',
        timestamp: new Date().toISOString()
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, id]
    );

    return res.json({
      success: true,
      message: 'Senha atualizada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar senha',
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

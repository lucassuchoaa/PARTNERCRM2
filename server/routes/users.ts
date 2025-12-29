import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { filterUsersByPermission, getViewableRoles, canCreateRole, canViewRole, getCreatableRoles } from '../config/roleHierarchy';

const router = Router();

// Rota para obter roles permitidos para o usuário atual
router.get('/allowed-roles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || 'client';
    const creatableRoles = getCreatableRoles(userRole);

    return res.json({
      success: true,
      data: creatableRoles,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get allowed roles error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar roles permitidas',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || 'client';

    // Buscar todos os usuários
    const result = await query(
      'SELECT id, email, name, role, role_id, status, manager_id, created_at, last_login, permissions, phone, company, first_name, last_name, profile_image_url FROM users ORDER BY created_at DESC'
    );

    // Filtrar usuários baseado nas permissões
    const filteredUsers = filterUsersByPermission(result.rows, userRole);

    console.log(`👥 User with role '${userRole}' can view ${filteredUsers.length} of ${result.rows.length} users`);

    return res.json({
      success: true,
      data: filteredUsers,
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
    const creatorRole = req.user?.role || 'client';

    console.log('➕ Creating user');
    console.log('➕ Creator role:', creatorRole);
    console.log('➕ Target role:', role);
    console.log('➕ roleId received:', roleId);

    // Normalizar roleId - converter empty string para null
    const normalizedRoleId = roleId === '' ? null : roleId;
    console.log('➕ normalizedRoleId:', normalizedRoleId);

    if (!email || !name || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: email, name, password, role',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se o criador tem permissão para criar este role
    if (!canCreateRole(creatorRole, role)) {
      console.log(`❌ User with role '${creatorRole}' cannot create role '${role}'`);
      return res.status(403).json({
        success: false,
        error: `Você não tem permissão para criar usuários com o papel '${role}'`,
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
      [userId, email.toLowerCase(), name, hashedPassword, role, normalizedRoleId, managerId || null, permissions || []]
    );

    console.log(`✅ User created successfully with role '${role}' by '${creatorRole}'`);

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
    const editorRole = req.user?.role || 'client';

    console.log('📝 Updating user:', id);
    console.log('📝 Editor role:', editorRole);
    console.log('📝 New role:', role);
    console.log('📝 roleId received:', roleId);

    // Se está tentando alterar o role, verificar permissão
    if (role && !canCreateRole(editorRole, role)) {
      console.log(`❌ User with role '${editorRole}' cannot set role to '${role}'`);
      return res.status(403).json({
        success: false,
        error: `Você não tem permissão para definir o papel '${role}'`,
        timestamp: new Date().toISOString()
      });
    }

    // Normalizar roleId - converter empty string para null
    const normalizedRoleId = roleId === '' ? null : roleId;
    console.log('📝 normalizedRoleId:', normalizedRoleId);

    // Construir objeto de atualização apenas com campos fornecidos
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined && name !== null) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (role !== undefined && role !== null) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (normalizedRoleId !== undefined && normalizedRoleId !== null) {
      updates.push(`role_id = $${paramCount++}`);
      values.push(normalizedRoleId);
    }
    if (status !== undefined && status !== null) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (managerId !== undefined) {
      updates.push(`manager_id = $${paramCount++}`);
      values.push(managerId);
    }
    if (permissions !== undefined && permissions !== null) {
      updates.push(`permissions = $${paramCount++}`);
      values.push(permissions);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (company !== undefined) {
      updates.push(`company = $${paramCount++}`);
      values.push(company);
    }
    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (profileImageUrl !== undefined) {
      updates.push(`profile_image_url = $${paramCount++}`);
      values.push(profileImageUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar',
        timestamp: new Date().toISOString()
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query_text = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, role, role_id, status, manager_id, created_at, last_login, permissions, phone, company, first_name, last_name, profile_image_url`;

    console.log('📝 Query:', query_text);
    console.log('📝 Values:', values);

    const result = await query(query_text, values);

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

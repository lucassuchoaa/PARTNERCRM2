import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM pricing_plans WHERE is_active = true ORDER BY "order"'
    );
    
    return res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get pricing plans error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar planos',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM pricing_plans WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get pricing plan error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar plano',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, description, basePrice, includedUsers, additionalUserPrice, features, order } = req.body;
    
    if (!id || !name || basePrice === undefined || !includedUsers || additionalUserPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: id, name, basePrice, includedUsers, additionalUserPrice',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await query(
      `INSERT INTO pricing_plans (id, name, description, base_price, included_users, additional_user_price, features, "order", is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [id, name, description, basePrice, includedUsers, additionalUserPrice, features || [], order || 1]
    );
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Plano criado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Create pricing plan error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar plano',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, includedUsers, additionalUserPrice, features, order, isActive } = req.body;
    
    const result = await query(
      `UPDATE pricing_plans 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           base_price = COALESCE($3, base_price),
           included_users = COALESCE($4, included_users),
           additional_user_price = COALESCE($5, additional_user_price),
           features = COALESCE($6, features),
           "order" = COALESCE($7, "order"),
           is_active = COALESCE($8, is_active)
       WHERE id = $9
       RETURNING *`,
      [name, description, basePrice, includedUsers, additionalUserPrice, features, order, isActive, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Plano atualizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Update pricing plan error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar plano',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

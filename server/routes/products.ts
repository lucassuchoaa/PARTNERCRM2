import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM products WHERE is_active = true ORDER BY "order"'
    );
    
    return res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar produtos',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar produto',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, description, icon, color, order } = req.body;
    
    if (!id || !name || !icon || !color) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: id, name, icon, color',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await query(
      `INSERT INTO products (id, name, description, icon, color, "order", is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [id, name, description, icon, color, order || 1]
    );
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Produto criado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar produto',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, order, isActive } = req.body;
    
    const result = await query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           icon = COALESCE($3, icon),
           color = COALESCE($4, color),
           "order" = COALESCE($5, "order"),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, description, icon, color, order, isActive, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Produto atualizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar produto',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

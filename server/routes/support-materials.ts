import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM support_materials ORDER BY created_at DESC'
    );
    
    return res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get support materials error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar materiais de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM support_materials WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material de suporte não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get support material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, type, description, downloadUrl, viewUrl, fileSize, duration } = req.body;
    
    if (!title || !category || !type) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: title, category, type',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await query(
      `INSERT INTO support_materials (title, category, type, description, download_url, view_url, file_size, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, category, type, description, downloadUrl, viewUrl, fileSize, duration]
    );
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Material de suporte criado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Create support material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, category, type, description, downloadUrl, viewUrl, fileSize, duration } = req.body;
    
    const result = await query(
      `UPDATE support_materials 
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           type = COALESCE($3, type),
           description = COALESCE($4, description),
           download_url = COALESCE($5, download_url),
           view_url = COALESCE($6, view_url),
           file_size = COALESCE($7, file_size),
           duration = COALESCE($8, duration),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, category, type, description, downloadUrl, viewUrl, fileSize, duration, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material de suporte não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Material de suporte atualizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Update support material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM support_materials WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material de suporte não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      message: 'Material de suporte deletado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Delete support material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao deletar material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

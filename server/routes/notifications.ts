import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';

const router = Router();

// GET - Listar notificações (com filtro opcional por recipientId)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { recipientId } = req.query;
    
    let query = `
      SELECT 
        id, title, message, type,
        recipient_id as "recipientId",
        recipient_type as "recipientType",
        is_read as "isRead",
        email_sent as "emailSent",
        created_at as "createdAt"
      FROM notifications
    `;
    
    const params = [];
    if (recipientId) {
      query += ` WHERE recipient_id = $1 OR recipient_type = 'all'`;
      params.push(recipientId);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// POST - Criar notificação
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, type, recipientId, recipientType } = req.body;
    
    const result = await pool.query(`
      INSERT INTO notifications (title, message, type, recipient_id, recipient_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id, title, message, type,
        recipient_id as "recipientId",
        recipient_type as "recipientType",
        is_read as "isRead",
        email_sent as "emailSent",
        created_at as "createdAt"
    `, [title, message, type || 'info', recipientId, recipientType || 'specific']);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Erro ao criar notificação' });
  }
});

// PATCH - Marcar como lida
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;
    
    const result = await pool.query(`
      UPDATE notifications SET is_read = $1
      WHERE id = $2
      RETURNING 
        id, title, message, type,
        recipient_id as "recipientId",
        recipient_type as "recipientType",
        is_read as "isRead",
        email_sent as "emailSent",
        created_at as "createdAt"
    `, [isRead, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação' });
  }
});

export default router;

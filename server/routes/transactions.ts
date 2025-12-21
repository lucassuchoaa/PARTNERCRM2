import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';

const router = Router();

// GET - Listar todas as transações
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, client_id as "clientId", type, amount, status, date, description,
        created_at as "createdAt"
      FROM transactions
      ORDER BY date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// POST - Criar nova transação
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, type, amount, status, description } = req.body;
    
    const result = await pool.query(`
      INSERT INTO transactions (client_id, type, amount, status, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id, client_id as "clientId", type, amount, status, date, description,
        created_at as "createdAt"
    `, [clientId, type, amount, status || 'pending', description]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

export default router;

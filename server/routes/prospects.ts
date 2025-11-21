import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET - Listar todos os prospectos
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, company_name as "companyName", contact_name as "contactName",
        email, phone, cnpj, employees, segment, status,
        partner_id as "partnerId",
        submitted_at as "submittedAt",
        validated_at as "validatedAt",
        validated_by as "validatedBy",
        validation_notes as "validationNotes",
        is_approved as "isApproved",
        created_at as "createdAt"
      FROM prospects
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Erro ao buscar prospectos' });
  }
});

// POST - Criar novo prospecto
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName, contactName, email, phone, cnpj,
      employees, segment, partnerId
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO prospects (
        company_name, contact_name, email, phone, cnpj,
        employees, segment, partner_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, company_name as "companyName", contact_name as "contactName",
        email, phone, cnpj, employees, segment, status,
        partner_id as "partnerId",
        submitted_at as "submittedAt",
        created_at as "createdAt"
    `, [companyName, contactName, email, phone, cnpj, employees, segment, partnerId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating prospect:', error);
    res.status(500).json({ error: 'Erro ao criar prospecto' });
  }
});

// PATCH - Validar prospecto
router.patch('/:id/validate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved, validatedBy, validationNotes, status } = req.body;
    
    const result = await pool.query(`
      UPDATE prospects SET
        is_approved = $1,
        validated_by = $2,
        validation_notes = $3,
        validated_at = NOW(),
        status = $4
      WHERE id = $5
      RETURNING 
        id, company_name as "companyName", contact_name as "contactName",
        email, phone, cnpj, employees, segment, status,
        partner_id as "partnerId",
        submitted_at as "submittedAt",
        validated_at as "validatedAt",
        validated_by as "validatedBy",
        validation_notes as "validationNotes",
        is_approved as "isApproved"
    `, [isApproved, validatedBy, validationNotes, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospecto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error validating prospect:', error);
    res.status(500).json({ error: 'Erro ao validar prospecto' });
  }
});

export default router;

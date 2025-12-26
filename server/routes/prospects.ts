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

// PUT - Atualizar prospecto completo
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      companyName, contactName, email, phone, cnpj,
      employees, segment, status, partnerId, adminValidation
    } = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (companyName !== undefined) { updates.push(`company_name = $${paramIndex++}`); values.push(companyName); }
    if (contactName !== undefined) { updates.push(`contact_name = $${paramIndex++}`); values.push(contactName); }
    if (email !== undefined) { updates.push(`email = $${paramIndex++}`); values.push(email); }
    if (phone !== undefined) { updates.push(`phone = $${paramIndex++}`); values.push(phone); }
    if (cnpj !== undefined) { updates.push(`cnpj = $${paramIndex++}`); values.push(cnpj); }
    if (employees !== undefined) { updates.push(`employees = $${paramIndex++}`); values.push(employees); }
    if (segment !== undefined) { updates.push(`segment = $${paramIndex++}`); values.push(segment); }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
    if (partnerId !== undefined) { updates.push(`partner_id = $${paramIndex++}`); values.push(partnerId); }

    // Handle adminValidation object
    if (adminValidation) {
      if (adminValidation.isApproved !== undefined) {
        updates.push(`is_approved = $${paramIndex++}`);
        values.push(adminValidation.isApproved);
      }
      if (adminValidation.validatedBy !== undefined) {
        updates.push(`validated_by = $${paramIndex++}`);
        values.push(adminValidation.validatedBy);
      }
      if (adminValidation.validatedAt !== undefined) {
        updates.push(`validated_at = $${paramIndex++}`);
        values.push(adminValidation.validatedAt);
      }
      if (adminValidation.notes !== undefined) {
        updates.push(`validation_notes = $${paramIndex++}`);
        values.push(adminValidation.notes);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);

    const result = await pool.query(`
      UPDATE prospects SET
        ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id, company_name as "companyName", contact_name as "contactName",
        email, phone, cnpj, employees, segment, status,
        partner_id as "partnerId",
        submitted_at as "submittedAt",
        validated_at as "validatedAt",
        validated_by as "validatedBy",
        validation_notes as "validationNotes",
        is_approved as "isApproved",
        created_at as "createdAt"
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospecto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating prospect:', error);
    res.status(500).json({ error: 'Erro ao atualizar prospecto' });
  }
});

// PATCH - Validar prospecto e criar cliente se aprovado
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
    
    const prospect = result.rows[0];
    
    // Se aprovado, criar cliente automaticamente
    if (isApproved === true && status === 'approved') {
      try {
        await pool.query(`
          INSERT INTO clients (
            name, email, phone, cnpj, status, stage, temperature,
            total_lives, partner_id, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (email) DO NOTHING
        `, [
          prospect.contactName || prospect.companyName,
          prospect.email,
          prospect.phone,
          prospect.cnpj,
          'ativo',
          'prospeccao',
          'quente',
          1,
          prospect.partnerId,
          validationNotes || ''
        ]);
        console.log(`✅ Cliente criado automaticamente a partir do prospecto ${id}`);
      } catch (error) {
        console.error('Aviso: Erro ao criar cliente automático:', error);
      }
    }
    
    res.json(prospect);
  } catch (error) {
    console.error('Error validating prospect:', error);
    res.status(500).json({ error: 'Erro ao validar prospecto' });
  }
});

export default router;

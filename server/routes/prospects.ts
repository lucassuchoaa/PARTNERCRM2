import { Router, Response } from 'express';
import { pool, getClient } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';
import { createProspectSchema, updateProspectSchema, validateProspectSchema } from '../utils/validation';

// Whitelist de colunas permitidas para UPDATE (proteção SQL injection)
const ALLOWED_PROSPECT_COLUMNS = new Set([
  'company_name', 'contact_name', 'email', 'phone',
  'cnpj', 'employees', 'segment', 'status', 'partner_id',
  'is_approved', 'validated_by', 'validated_at', 'validation_notes'
]);

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
    // Validar input com Zod
    const validated = createProspectSchema.parse(req.body);

    const {
      companyName, contactName, email, phone, cnpj,
      employees, segment, partnerId
    } = validated;

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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

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

    // Build dynamic update query com whitelist de segurança
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Verificar colunas contra whitelist (proteção SQL injection)
    const columnMapping: Record<string, string> = {
      companyName: 'company_name',
      contactName: 'contact_name',
      email: 'email',
      phone: 'phone',
      cnpj: 'cnpj',
      employees: 'employees',
      segment: 'segment',
      status: 'status',
      partnerId: 'partner_id'
    };

    if (companyName !== undefined) {
      const col = columnMapping.companyName;
      if (!ALLOWED_PROSPECT_COLUMNS.has(col)) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`${col} = $${paramIndex++}`);
      values.push(companyName);
    }
    if (contactName !== undefined) {
      const col = columnMapping.contactName;
      if (!ALLOWED_PROSPECT_COLUMNS.has(col)) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`${col} = $${paramIndex++}`);
      values.push(contactName);
    }
    if (email !== undefined) {
      if (!ALLOWED_PROSPECT_COLUMNS.has('email')) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      if (!ALLOWED_PROSPECT_COLUMNS.has('phone')) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (cnpj !== undefined) {
      if (!ALLOWED_PROSPECT_COLUMNS.has('cnpj')) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`cnpj = $${paramIndex++}`);
      values.push(cnpj);
    }
    if (employees !== undefined) {
      if (!ALLOWED_PROSPECT_COLUMNS.has('employees')) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`employees = $${paramIndex++}`);
      values.push(employees);
    }
    if (segment !== undefined) {
      if (!ALLOWED_PROSPECT_COLUMNS.has('segment')) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`segment = $${paramIndex++}`);
      values.push(segment);
    }
    if (status !== undefined) {
      if (!ALLOWED_PROSPECT_COLUMNS.has('status')) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (partnerId !== undefined) {
      const col = columnMapping.partnerId;
      if (!ALLOWED_PROSPECT_COLUMNS.has(col)) {
        return res.status(400).json({ error: 'Coluna inválida detectada' });
      }
      updates.push(`${col} = $${paramIndex++}`);
      values.push(partnerId);
    }

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
  const { client, release } = await getClient();

  try {
    const { id } = req.params;
    const { isApproved, validatedBy, validationNotes, status } = req.body;

    // Iniciar transação para garantir consistência
    await client.query('BEGIN');

    // 1. Atualizar prospect
    const result = await client.query(`
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
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Prospecto não encontrado' });
    }

    const prospect = result.rows[0];

    // 2. Se aprovado, criar cliente automaticamente
    if (isApproved === true && status === 'approved') {
      try {
        // Tentar criar cliente com prospect_id para rastreamento
        const clientResult = await client.query(`
          INSERT INTO clients (
            name, email, phone, cnpj, status, stage, temperature,
            total_lives, partner_id, notes, prospect_id,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING id
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
          validationNotes || '',
          id  // prospect_id para rastreamento
        ]);

        if (clientResult.rows.length === 0) {
          throw new Error('Cliente não foi criado (possível email duplicado)');
        }

        const clientId = clientResult.rows[0].id;
        console.log(`✅ Cliente ${clientId} criado automaticamente do prospect ${id}`);

        // Commit da transação - sucesso total
        await client.query('COMMIT');

        res.json({
          ...prospect,
          clientId: clientId,
          message: 'Prospect aprovado e cliente criado com sucesso'
        });

      } catch (clientError: any) {
        // Erro ao criar cliente - fazer rollback
        await client.query('ROLLBACK');

        console.error('❌ ERRO ao criar cliente automático:', clientError);
        console.error('   Prospect ID:', id);
        console.error('   Email:', prospect.email);
        console.error('   Detalhes:', clientError.message);

        // Verificar se é duplicata
        const isDuplicate = clientError.message?.includes('duplicate') ||
                           clientError.code === '23505';

        if (isDuplicate) {
          return res.status(409).json({
            error: 'Cliente com este email já existe',
            details: 'Um cliente com este email já está cadastrado no sistema',
            prospectId: id,
            email: prospect.email
          });
        }

        // Outro tipo de erro
        return res.status(500).json({
          error: 'Erro ao criar cliente automaticamente',
          details: clientError.message,
          prospectId: id,
          message: 'O prospect não foi aprovado devido a erro na criação do cliente'
        });
      }
    } else {
      // Prospect validado mas não aprovado, ou status diferente
      await client.query('COMMIT');
      res.json(prospect);
    }

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao validar prospect:', error);
    res.status(500).json({
      error: 'Erro ao validar prospecto',
      details: error.message
    });
  } finally {
    release();
  }
});

export default router;

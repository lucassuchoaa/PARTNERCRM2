import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET - Listar todos os clientes
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let result;

    if (userRole === 'admin') {
      // Admin vê todos os clientes
      result = await pool.query(`
        SELECT
          id, name, email, phone, cnpj, cpf, status, stage, temperature,
          total_lives as "totalLives",
          partner_id as "partnerId",
          partner_name as "partnerName",
          contract_end_date as "contractEndDate",
          registration_date as "registrationDate",
          last_contact_date as "lastContactDate",
          last_updated as "lastUpdated",
          notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId",
          current_products as "currentProducts",
          viability_score as "viabilityScore",
          potential_products_with_values as "potentialProductsWithValues",
          custom_recommendations as "customRecommendations"
        FROM clients
        ORDER BY last_updated DESC
      `);
    } else if (userRole === 'manager') {
      // Gerente vê clientes dos parceiros que ele gerencia + os próprios
      result = await pool.query(`
        SELECT
          c.id, c.name, c.email, c.phone, c.cnpj, c.cpf, c.status, c.stage, c.temperature,
          c.total_lives as "totalLives",
          c.partner_id as "partnerId",
          c.partner_name as "partnerName",
          c.contract_end_date as "contractEndDate",
          c.registration_date as "registrationDate",
          c.last_contact_date as "lastContactDate",
          c.last_updated as "lastUpdated",
          c.notes, c.hubspot_id as "hubspotId", c.netsuite_id as "netsuiteId",
          c.current_products as "currentProducts",
          c.viability_score as "viabilityScore",
          c.potential_products_with_values as "potentialProductsWithValues",
          c.custom_recommendations as "customRecommendations"
        FROM clients c
        WHERE c.partner_id IN (
          SELECT id FROM users WHERE manager_id = $1
        )
        OR c.partner_id = $1
        ORDER BY c.last_updated DESC
      `, [userId]);
    } else {
      // Parceiro vê apenas seus próprios clientes
      result = await pool.query(`
        SELECT
          id, name, email, phone, cnpj, cpf, status, stage, temperature,
          total_lives as "totalLives",
          partner_id as "partnerId",
          partner_name as "partnerName",
          contract_end_date as "contractEndDate",
          registration_date as "registrationDate",
          last_contact_date as "lastContactDate",
          last_updated as "lastUpdated",
          notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId",
          current_products as "currentProducts",
          viability_score as "viabilityScore",
          potential_products_with_values as "potentialProductsWithValues",
          custom_recommendations as "customRecommendations"
        FROM clients
        WHERE partner_id = $1
        ORDER BY last_updated DESC
      `, [userId]);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// GET - Buscar cliente por ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        id, name, email, phone, cnpj, cpf, status, stage, temperature,
        total_lives as "totalLives",
        partner_id as "partnerId",
        partner_name as "partnerName",
        contract_end_date as "contractEndDate",
        registration_date as "registrationDate",
        last_contact_date as "lastContactDate",
        last_updated as "lastUpdated",
        notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId",
        current_products as "currentProducts",
        viability_score as "viabilityScore",
        potential_products_with_values as "potentialProductsWithValues",
        custom_recommendations as "customRecommendations"
      FROM clients WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// POST - Criar novo cliente
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, email, phone, cnpj, cpf, status, stage, temperature,
      totalLives, partnerId, partnerName, contractEndDate,
      lastContactDate, notes, hubspotId, netsuiteId
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO clients (
        name, email, phone, cnpj, cpf, status, stage, temperature,
        total_lives, partner_id, partner_name, contract_end_date,
        last_contact_date, notes, hubspot_id, netsuite_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING 
        id, name, email, phone, cnpj, cpf, status, stage, temperature,
        total_lives as "totalLives",
        partner_id as "partnerId",
        partner_name as "partnerName",
        contract_end_date as "contractEndDate",
        registration_date as "registrationDate",
        last_contact_date as "lastContactDate",
        last_updated as "lastUpdated",
        notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId"
    `, [
      name, email, phone, cnpj, cpf, status, stage, temperature,
      totalLives, partnerId, partnerName, contractEndDate,
      lastContactDate, notes, hubspotId, netsuiteId
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PUT - Atualizar cliente
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Map frontend field names to database column names
    const fieldMapping: Record<string, string> = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      cnpj: 'cnpj',
      cpf: 'cpf',
      status: 'status',
      stage: 'stage',
      temperature: 'temperature',
      totalLives: 'total_lives',
      partnerId: 'partner_id',
      partnerName: 'partner_name',
      contractEndDate: 'contract_end_date',
      lastContactDate: 'last_contact_date',
      notes: 'notes',
      hubspotId: 'hubspot_id',
      netsuiteId: 'netsuite_id',
      currentProducts: 'current_products',
      viabilityScore: 'viability_score',
      potentialProductsWithValues: 'potential_products_with_values',
      customRecommendations: 'custom_recommendations'
    };

    // Add fields that are present in the request body
    for (const [frontendField, dbColumn] of Object.entries(fieldMapping)) {
      if (body[frontendField] !== undefined) {
        updates.push(`${dbColumn} = $${paramIndex++}`);
        // Convert arrays/objects to JSON strings if needed
        const value = typeof body[frontendField] === 'object' && body[frontendField] !== null
          ? JSON.stringify(body[frontendField])
          : body[frontendField];
        values.push(value);
      }
    }

    // Always update last_updated
    updates.push(`last_updated = NOW()`);

    if (updates.length === 1) { // Only last_updated
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);

    const result = await pool.query(`
      UPDATE clients SET
        ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id, name, email, phone, cnpj, cpf, status, stage, temperature,
        total_lives as "totalLives",
        partner_id as "partnerId",
        partner_name as "partnerName",
        contract_end_date as "contractEndDate",
        registration_date as "registrationDate",
        last_contact_date as "lastContactDate",
        last_updated as "lastUpdated",
        notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId",
        current_products as "currentProducts",
        viability_score as "viabilityScore",
        potential_products_with_values as "potentialProductsWithValues",
        custom_recommendations as "customRecommendations"
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating client:', error);
    console.error('Request body:', req.body);
    console.error('Error details:', error.message);
    res.status(500).json({
      error: 'Erro ao atualizar cliente',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE - Deletar cliente
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json({ success: true, message: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

export default router;

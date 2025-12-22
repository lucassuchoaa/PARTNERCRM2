import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';

const router = Router();

// GET - Listar todos os clientes
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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
        notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId"
      FROM clients
      ORDER BY last_updated DESC
    `);
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
        notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId"
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

// PUT - Atualizar cliente (completo)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, cnpj, cpf, status, stage, temperature,
      totalLives, partnerId, partnerName, contractEndDate,
      lastContactDate, notes, hubspotId, netsuiteId
    } = req.body;

    const result = await pool.query(`
      UPDATE clients SET
        name = $1, email = $2, phone = $3, cnpj = $4, cpf = $5,
        status = $6, stage = $7, temperature = $8, total_lives = $9,
        partner_id = $10, partner_name = $11, contract_end_date = $12,
        last_contact_date = $13, notes = $14, hubspot_id = $15,
        netsuite_id = $16, last_updated = NOW()
      WHERE id = $17
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
      lastContactDate, notes, hubspotId, netsuiteId, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// PATCH - Atualizar cliente (parcial)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('[Clients PATCH] Updating client:', id);
    console.log('[Clients PATCH] Request body:', JSON.stringify(req.body, null, 2));

    // Buscar cliente atual primeiro
    const currentClient = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

    if (currentClient.rows.length === 0) {
      console.log('[Clients PATCH] Cliente não encontrado:', id);
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Construir query de update dinamicamente com os campos fornecidos
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

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
      potentialProducts: 'potential_products',
      viabilityScore: 'viability_score',
      customRecommendations: 'custom_recommendations',
      potentialProductsWithValues: 'potential_products_with_values'
    };

    // Processar cada campo fornecido no body
    Object.keys(req.body).forEach(key => {
      if (key === 'lastUpdated' || key === 'id') return; // Ignorar esses campos

      const dbField = fieldMapping[key];
      if (dbField) {
        updates.push(`${dbField} = $${paramIndex++}`);
        values.push(req.body[key]);
      }
    });

    // Sempre atualizar last_updated
    updates.push(`last_updated = NOW()`);

    if (updates.length === 1) { // Apenas last_updated
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id); // ID para o WHERE

    console.log('[Clients PATCH] Query updates:', updates);
    console.log('[Clients PATCH] Query values:', values);

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
        potential_products as "potentialProducts",
        viability_score as "viabilityScore",
        custom_recommendations as "customRecommendations",
        potential_products_with_values as "potentialProductsWithValues"
    `, values);

    console.log('[Clients PATCH] Updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Clients PATCH] Error updating client:', error);
    console.error('[Clients PATCH] Error details:', error.message);
    console.error('[Clients PATCH] Error stack:', error.stack);
    res.status(500).json({
      error: 'Erro ao atualizar cliente',
      details: error.message
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

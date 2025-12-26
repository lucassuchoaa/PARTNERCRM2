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
          notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId"
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
          c.notes, c.hubspot_id as "hubspotId", c.netsuite_id as "netsuiteId"
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
          notes, hubspot_id as "hubspotId", netsuite_id as "netsuiteId"
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

// PUT - Atualizar cliente
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

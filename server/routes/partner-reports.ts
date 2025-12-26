import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET - Listar todos os relatórios de parceiros
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let result;

    if (userRole === 'admin') {
      // Admin vê todos os relatórios
      result = await pool.query(`
        SELECT
          id,
          partner_id as "partnerId",
          month,
          year,
          total_referrals as "totalReferrals",
          approved_referrals as "approvedReferrals",
          rejected_referrals as "rejectedReferrals",
          pending_referrals as "pendingReferrals",
          total_commission as "totalCommission",
          paid_commission as "paidCommission",
          pending_commission as "pendingCommission",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM partner_reports
        ORDER BY year DESC, month DESC
      `);
    } else if (userRole === 'manager') {
      // Gerente vê relatórios dos parceiros que gerencia + próprios
      result = await pool.query(`
        SELECT
          pr.id,
          pr.partner_id as "partnerId",
          pr.month,
          pr.year,
          pr.total_referrals as "totalReferrals",
          pr.approved_referrals as "approvedReferrals",
          pr.rejected_referrals as "rejectedReferrals",
          pr.pending_referrals as "pendingReferrals",
          pr.total_commission as "totalCommission",
          pr.paid_commission as "paidCommission",
          pr.pending_commission as "pendingCommission",
          pr.created_at as "createdAt",
          pr.updated_at as "updatedAt"
        FROM partner_reports pr
        WHERE pr.partner_id IN (
          SELECT id FROM users WHERE manager_id = $1
        )
        OR pr.partner_id = $1
        ORDER BY pr.year DESC, pr.month DESC
      `, [userId]);
    } else {
      // Parceiro vê apenas seus próprios relatórios
      result = await pool.query(`
        SELECT
          id,
          partner_id as "partnerId",
          month,
          year,
          total_referrals as "totalReferrals",
          approved_referrals as "approvedReferrals",
          rejected_referrals as "rejectedReferrals",
          pending_referrals as "pendingReferrals",
          total_commission as "totalCommission",
          paid_commission as "paidCommission",
          pending_commission as "pendingCommission",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM partner_reports
        WHERE partner_id = $1
        ORDER BY year DESC, month DESC
      `, [userId]);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching partner reports:', error);
    res.status(500).json({ error: 'Erro ao buscar relatórios de parceiros' });
  }
});

// GET - Buscar relatório por ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = `
      SELECT
        id,
        partner_id as "partnerId",
        month,
        year,
        total_referrals as "totalReferrals",
        approved_referrals as "approvedReferrals",
        rejected_referrals as "rejectedReferrals",
        pending_referrals as "pendingReferrals",
        total_commission as "totalCommission",
        paid_commission as "paidCommission",
        pending_commission as "pendingCommission",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM partner_reports
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    const report = result.rows[0];

    // Verificar permissões
    if (userRole !== 'admin' && userRole !== 'manager' && report.partnerId !== userId) {
      return res.status(403).json({ error: 'Sem permissão para acessar este relatório' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching partner report:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório' });
  }
});

// POST - Criar novo relatório (apenas admin)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem criar relatórios' });
    }

    const {
      partnerId,
      month,
      year,
      totalReferrals = 0,
      approvedReferrals = 0,
      rejectedReferrals = 0,
      pendingReferrals = 0,
      totalCommission = 0,
      paidCommission = 0,
      pendingCommission = 0
    } = req.body;

    const result = await pool.query(`
      INSERT INTO partner_reports (
        partner_id, month, year,
        total_referrals, approved_referrals, rejected_referrals, pending_referrals,
        total_commission, paid_commission, pending_commission
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id,
        partner_id as "partnerId",
        month,
        year,
        total_referrals as "totalReferrals",
        approved_referrals as "approvedReferrals",
        rejected_referrals as "rejectedReferrals",
        pending_referrals as "pendingReferrals",
        total_commission as "totalCommission",
        paid_commission as "paidCommission",
        pending_commission as "pendingCommission",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [
      partnerId, month, year,
      totalReferrals, approvedReferrals, rejectedReferrals, pendingReferrals,
      totalCommission, paidCommission, pendingCommission
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating partner report:', error);
    res.status(500).json({ error: 'Erro ao criar relatório' });
  }
});

// PUT - Atualizar relatório (apenas admin)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem atualizar relatórios' });
    }

    const {
      totalReferrals,
      approvedReferrals,
      rejectedReferrals,
      pendingReferrals,
      totalCommission,
      paidCommission,
      pendingCommission
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (totalReferrals !== undefined) { updates.push(`total_referrals = $${paramIndex++}`); values.push(totalReferrals); }
    if (approvedReferrals !== undefined) { updates.push(`approved_referrals = $${paramIndex++}`); values.push(approvedReferrals); }
    if (rejectedReferrals !== undefined) { updates.push(`rejected_referrals = $${paramIndex++}`); values.push(rejectedReferrals); }
    if (pendingReferrals !== undefined) { updates.push(`pending_referrals = $${paramIndex++}`); values.push(pendingReferrals); }
    if (totalCommission !== undefined) { updates.push(`total_commission = $${paramIndex++}`); values.push(totalCommission); }
    if (paidCommission !== undefined) { updates.push(`paid_commission = $${paramIndex++}`); values.push(paidCommission); }
    if (pendingCommission !== undefined) { updates.push(`pending_commission = $${paramIndex++}`); values.push(pendingCommission); }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);

    const result = await pool.query(`
      UPDATE partner_reports SET
        ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id,
        partner_id as "partnerId",
        month,
        year,
        total_referrals as "totalReferrals",
        approved_referrals as "approvedReferrals",
        rejected_referrals as "rejectedReferrals",
        pending_referrals as "pendingReferrals",
        total_commission as "totalCommission",
        paid_commission as "paidCommission",
        pending_commission as "pendingCommission",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating partner report:', error);
    res.status(500).json({ error: 'Erro ao atualizar relatório' });
  }
});

// DELETE - Deletar relatório (apenas admin)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem deletar relatórios' });
    }

    const result = await pool.query('DELETE FROM partner_reports WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    res.json({ success: true, message: 'Relatório deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting partner report:', error);
    res.status(500).json({ error: 'Erro ao deletar relatório' });
  }
});

export default router;

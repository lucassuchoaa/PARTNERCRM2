import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET - Listar todos os relatórios de parceiros
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log('📊 Fetching partner reports');
    console.log('📊 User ID:', userId);
    console.log('📊 User Role:', userRole);

    let result;

    if (userRole === 'admin') {
      // Admin vê todos os relatórios
      result = await pool.query(`
        SELECT
          pr.id,
          pr.partner_id as "partnerId",
          u.name as "partnerName",
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
        LEFT JOIN users u ON pr.partner_id = u.id
        ORDER BY pr.year DESC, pr.month DESC
      `);
    } else if (userRole === 'manager') {
      // Gerente vê relatórios dos parceiros que gerencia + próprios
      result = await pool.query(`
        SELECT
          pr.id,
          pr.partner_id as "partnerId",
          u.name as "partnerName",
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
        LEFT JOIN users u ON pr.partner_id = u.id
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
          pr.id,
          pr.partner_id as "partnerId",
          u.name as "partnerName",
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
        LEFT JOIN users u ON pr.partner_id = u.id
        WHERE pr.partner_id = $1
        ORDER BY pr.year DESC, pr.month DESC
      `, [userId]);
    }

    console.log('📊 Results found:', result.rows.length);
    console.log('📊 Sample data:', result.rows[0]);

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

// POST - Criar ou atualizar relatório (apenas admin)
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

    // Usar UPSERT para evitar erro de duplicidade
    const result = await pool.query(`
      INSERT INTO partner_reports (
        partner_id, month, year,
        total_referrals, approved_referrals, rejected_referrals, pending_referrals,
        total_commission, paid_commission, pending_commission
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (partner_id, month, year) DO UPDATE SET
        updated_at = NOW()
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

// POST - Gerar relatório automaticamente baseado em prospects
router.post('/generate/:partnerId/:year/:month', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { partnerId, year, month } = req.params;

    // Apenas admin pode gerar relatórios
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem gerar relatórios' });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Ano ou mês inválido' });
    }

    // Verificar se já existe relatório para este período
    const existing = await pool.query(
      'SELECT id FROM partner_reports WHERE partner_id = $1 AND month = $2 AND year = $3',
      [partnerId, monthNum, yearNum]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Já existe relatório para este período' });
    }

    // Buscar prospects do parceiro neste período
    const prospects = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM prospects
      WHERE partner_id = $1
        AND EXTRACT(MONTH FROM submitted_at) = $2
        AND EXTRACT(YEAR FROM submitted_at) = $3
      GROUP BY status
    `, [partnerId, monthNum, yearNum]);

    let totalReferrals = 0;
    let approvedReferrals = 0;
    let rejectedReferrals = 0;
    let pendingReferrals = 0;

    prospects.rows.forEach(row => {
      const count = parseInt(row.count);
      totalReferrals += count;

      if (row.status === 'approved') approvedReferrals = count;
      else if (row.status === 'rejected') rejectedReferrals = count;
      else if (row.status === 'pending' || row.status === 'validated' || row.status === 'in-analysis') {
        pendingReferrals += count;
      }
    });

    // Calcular comissões (exemplo: R$ 100 por indicação aprovada)
    const comissionPerApproval = 100;
    const totalCommission = approvedReferrals * comissionPerApproval;
    const paidCommission = totalCommission; // Por padrão, pago totalmente
    const pendingCommission = 0;

    // Criar relatório
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
      partnerId, monthNum, yearNum,
      totalReferrals, approvedReferrals, rejectedReferrals, pendingReferrals,
      totalCommission, paidCommission, pendingCommission
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error generating partner report:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// POST - Gerar relatórios para todos os parceiros de um mês
router.post('/generate-all/:year/:month', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const { year, month } = req.params;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem gerar relatórios' });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Ano ou mês inválido' });
    }

    // Buscar todos os parceiros que têm prospects neste período
    const partners = await pool.query(`
      SELECT DISTINCT partner_id
      FROM prospects
      WHERE EXTRACT(MONTH FROM submitted_at) = $1
        AND EXTRACT(YEAR FROM submitted_at) = $2
        AND partner_id IS NOT NULL
    `, [monthNum, yearNum]);

    const generated = [];
    const errors = [];

    for (const partner of partners.rows) {
      try {
        // Verificar se já existe
        const existing = await pool.query(
          'SELECT id FROM partner_reports WHERE partner_id = $1 AND month = $2 AND year = $3',
          [partner.partner_id, monthNum, yearNum]
        );

        if (existing.rows.length > 0) {
          continue; // Pular se já existe
        }

        // Buscar prospects do parceiro
        const prospects = await pool.query(`
          SELECT
            status,
            COUNT(*) as count
          FROM prospects
          WHERE partner_id = $1
            AND EXTRACT(MONTH FROM submitted_at) = $2
            AND EXTRACT(YEAR FROM submitted_at) = $3
          GROUP BY status
        `, [partner.partner_id, monthNum, yearNum]);

        let totalReferrals = 0;
        let approvedReferrals = 0;
        let rejectedReferrals = 0;
        let pendingReferrals = 0;

        prospects.rows.forEach(row => {
          const count = parseInt(row.count);
          totalReferrals += count;

          if (row.status === 'approved') approvedReferrals = count;
          else if (row.status === 'rejected') rejectedReferrals = count;
          else if (row.status === 'pending' || row.status === 'validated' || row.status === 'in-analysis') {
            pendingReferrals += count;
          }
        });

        const comissionPerApproval = 100;
        const totalCommission = approvedReferrals * comissionPerApproval;
        const paidCommission = totalCommission;
        const pendingCommission = 0;

        // Criar relatório
        const result = await pool.query(`
          INSERT INTO partner_reports (
            partner_id, month, year,
            total_referrals, approved_referrals, rejected_referrals, pending_referrals,
            total_commission, paid_commission, pending_commission
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, partner_id as "partnerId"
        `, [
          partner.partner_id, monthNum, yearNum,
          totalReferrals, approvedReferrals, rejectedReferrals, pendingReferrals,
          totalCommission, paidCommission, pendingCommission
        ]);

        generated.push(result.rows[0]);
      } catch (error: any) {
        errors.push({ partnerId: partner.partner_id, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      generated: generated.length,
      errors: errors.length,
      details: { generated, errors }
    });
  } catch (error) {
    console.error('Error generating all partner reports:', error);
    res.status(500).json({ error: 'Erro ao gerar relatórios' });
  }
});

export default router;

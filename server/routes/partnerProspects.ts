import { Router, Response, Request } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET - Listar prospects de parceiros
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let result;

    if (userRole === 'admin') {
      // Admin vê todos os prospects de parceiros
      result = await pool.query(`
        SELECT
          id, name, email, phone, company, cnpj,
          referred_by_partner_id as "referredByPartnerId",
          referred_by_partner_name as "referredByPartnerName",
          status,
          created_at as "createdAt",
          approved_at as "approvedAt",
          approved_by as "approvedBy",
          approval_notes as "approvalNotes"
        FROM partner_prospects
        ORDER BY created_at DESC
      `);
    } else if (userRole === 'manager') {
      // Gerente vê prospects dos parceiros que ele gerencia
      result = await pool.query(`
        SELECT
          pp.id, pp.name, pp.email, pp.phone, pp.company, pp.cnpj,
          pp.referred_by_partner_id as "referredByPartnerId",
          pp.referred_by_partner_name as "referredByPartnerName",
          pp.status,
          pp.created_at as "createdAt",
          pp.approved_at as "approvedAt",
          pp.approved_by as "approvedBy",
          pp.approval_notes as "approvalNotes"
        FROM partner_prospects pp
        WHERE pp.referred_by_partner_id IN (
          SELECT id FROM users WHERE manager_id = $1
        )
        ORDER BY pp.created_at DESC
      `, [userId]);
    } else if (userRole === 'partner') {
      // Parceiro vê apenas prospects que ele indicou
      result = await pool.query(`
        SELECT
          id, name, email, phone, company, cnpj,
          referred_by_partner_id as "referredByPartnerId",
          referred_by_partner_name as "referredByPartnerName",
          status,
          created_at as "createdAt",
          approved_at as "approvedAt",
          approved_by as "approvedBy",
          approval_notes as "approvalNotes"
        FROM partner_prospects
        WHERE referred_by_partner_id = $1
        ORDER BY created_at DESC
      `, [userId]);
    } else {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching partner prospects:', error);
    res.status(500).json({ error: 'Erro ao buscar prospects de parceiros' });
  }
});

// POST - Criar prospect de parceiro (público, usado pela landing page)
router.post('/public', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      cnpj,
      referredByPartnerSlug,
      referredByManagerSlug
    } = req.body;

    if (!name || !email || (!referredByPartnerSlug && !referredByManagerSlug)) {
      return res.status(400).json({
        error: 'Nome, email e código do parceiro/gerente são obrigatórios'
      });
    }

    let referrer;
    let referrerId;
    let referrerName;
    let referrerRole;
    let managerId = null;

    // Buscar por slug de parceiro ou gerente
    if (referredByPartnerSlug) {
      const partnerResult = await pool.query(`
        SELECT id, name, role, manager_id
        FROM users
        WHERE partner_slug = $1 AND role = 'partner' AND status = 'active'
      `, [referredByPartnerSlug]);

      if (partnerResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Parceiro não encontrado ou inativo'
        });
      }

      referrer = partnerResult.rows[0];
      referrerId = referrer.id;
      referrerName = referrer.name;
      referrerRole = referrer.role;
      managerId = referrer.manager_id;
    } else if (referredByManagerSlug) {
      const managerResult = await pool.query(`
        SELECT id, name, role
        FROM users
        WHERE manager_slug = $1 AND role = 'manager' AND status = 'active'
      `, [referredByManagerSlug]);

      if (managerResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Gerente não encontrado ou inativo'
        });
      }

      referrer = managerResult.rows[0];
      referrerId = referrer.id;
      referrerName = referrer.name;
      referrerRole = referrer.role;
      // Se foi indicado por gerente, o próprio gerente será o manager_id
      managerId = referrer.id;
    }

    // Criar prospect de parceiro
    const result = await pool.query(`
      INSERT INTO partner_prospects (
        name, email, phone, company, cnpj,
        referred_by_partner_id, referred_by_partner_name, manager_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id, name, email, phone, company, cnpj,
        referred_by_partner_id as "referredByPartnerId",
        referred_by_partner_name as "referredByPartnerName",
        status,
        created_at as "createdAt"
    `, [
      name,
      email.toLowerCase().trim(),
      phone,
      company,
      cnpj,
      referrerId,
      referrerName,
      managerId
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating partner prospect:', error);

    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'Este email já está cadastrado'
      });
    }

    res.status(500).json({
      error: 'Erro ao criar prospect de parceiro'
    });
  }
});

// PATCH - Aprovar/rejeitar prospect de parceiro
router.patch('/:id/approve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved, approvalNotes } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name;
    const userRole = req.user?.role;

    // Apenas gerentes e admins podem aprovar
    if (userRole !== 'manager' && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Apenas gerentes e admins podem aprovar prospects de parceiros'
      });
    }

    const status = isApproved ? 'approved' : 'rejected';

    // Buscar prospect
    const prospectResult = await pool.query(`
      SELECT * FROM partner_prospects WHERE id = $1
    `, [id]);

    if (prospectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect não encontrado' });
    }

    const prospect = prospectResult.rows[0];

    // Atualizar status do prospect
    await pool.query(`
      UPDATE partner_prospects
      SET
        status = $1,
        approved_at = NOW(),
        approved_by = $2,
        approval_notes = $3
      WHERE id = $4
    `, [status, userName, approvalNotes, id]);

    // Se aprovado, criar novo parceiro automaticamente
    if (isApproved) {
      try {
        // Buscar o gerente do parceiro indicador
        const referrerResult = await pool.query(`
          SELECT manager_id FROM users WHERE id = $1
        `, [prospect.referred_by_partner_id]);

        const managerId = referrerResult.rows[0]?.manager_id;

        // Gerar ID único para novo parceiro
        const newPartnerId = `partner_${Date.now()}`;

        // Gerar slug único
        const baseSlug = prospect.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        let slug = baseSlug;
        let counter = 1;

        while (true) {
          const existingSlug = await pool.query(
            'SELECT id FROM users WHERE partner_slug = $1',
            [slug]
          );
          if (existingSlug.rows.length === 0) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Criar novo usuário parceiro
        await pool.query(`
          INSERT INTO users (
            id, email, name, role, status, manager_id,
            company, cnpj, phone, partner_slug, created_at
          )
          VALUES ($1, $2, $3, 'partner', 'active', $4, $5, $6, $7, $8, NOW())
        `, [
          newPartnerId,
          prospect.email,
          prospect.name,
          managerId,
          prospect.company,
          prospect.cnpj,
          prospect.phone,
          slug
        ]);

        console.log(`✅ Novo parceiro criado: ${prospect.name} (${newPartnerId})`);
      } catch (error) {
        console.error('Erro ao criar parceiro automaticamente:', error);
        // Não falhar a aprovação se houver erro na criação do parceiro
      }
    }

    // Retornar prospect atualizado
    const updatedProspect = await pool.query(`
      SELECT
        id, name, email, phone, company, cnpj,
        referred_by_partner_id as "referredByPartnerId",
        referred_by_partner_name as "referredByPartnerName",
        status,
        created_at as "createdAt",
        approved_at as "approvedAt",
        approved_by as "approvedBy",
        approval_notes as "approvalNotes"
      FROM partner_prospects
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      data: updatedProspect.rows[0]
    });
  } catch (error) {
    console.error('Error approving partner prospect:', error);
    res.status(500).json({
      error: 'Erro ao aprovar prospect de parceiro'
    });
  }
});

// GET - Buscar informações públicas do parceiro pelo slug (para landing page)
router.get('/public/partner/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(`
      SELECT
        id, name, email, company, partner_slug as "partnerSlug"
      FROM users
      WHERE partner_slug = $1 AND role = 'partner' AND status = 'active'
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Parceiro não encontrado'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching partner info:', error);
    res.status(500).json({
      error: 'Erro ao buscar informações do parceiro'
    });
  }
});

// GET - Buscar informações públicas do gerente pelo slug (para landing page)
router.get('/public/manager/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(`
      SELECT
        id, name, email, company, manager_slug as "managerSlug"
      FROM users
      WHERE manager_slug = $1 AND role = 'manager' AND status = 'active'
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Gerente não encontrado'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching manager info:', error);
    res.status(500).json({
      error: 'Erro ao buscar informações do gerente'
    });
  }
});

export default router;

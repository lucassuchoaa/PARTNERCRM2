import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM remuneration_tables ORDER BY id'
    );
    
    return res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get remuneration tables error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar tabelas de remuneração',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM remuneration_tables WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tabela de remuneração não encontrada',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get remuneration table error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar tabela de remuneração',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      employeeRangeStart,
      employeeRangeEnd,
      finderNegotiationMargin,
      maxCompanyCashback,
      finalFinderCashback,
      description,
      valueType
    } = req.body;
    
    if (!employeeRangeStart || !finderNegotiationMargin || !maxCompanyCashback || !finalFinderCashback) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: employeeRangeStart, finderNegotiationMargin, maxCompanyCashback, finalFinderCashback',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await query(
      `INSERT INTO remuneration_tables 
       (employee_range_start, employee_range_end, finder_negotiation_margin, max_company_cashback, final_finder_cashback, description, value_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [employeeRangeStart, employeeRangeEnd, finderNegotiationMargin, maxCompanyCashback, finalFinderCashback, description, valueType || 'percentage']
    );
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Tabela de remuneração criada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Create remuneration table error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar tabela de remuneração',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      employeeRangeStart,
      employeeRangeEnd,
      finderNegotiationMargin,
      maxCompanyCashback,
      finalFinderCashback,
      description,
      valueType
    } = req.body;
    
    const result = await query(
      `UPDATE remuneration_tables 
       SET employee_range_start = COALESCE($1, employee_range_start),
           employee_range_end = COALESCE($2, employee_range_end),
           finder_negotiation_margin = COALESCE($3, finder_negotiation_margin),
           max_company_cashback = COALESCE($4, max_company_cashback),
           final_finder_cashback = COALESCE($5, final_finder_cashback),
           description = COALESCE($6, description),
           value_type = COALESCE($7, value_type)
       WHERE id = $8
       RETURNING *`,
      [employeeRangeStart, employeeRangeEnd, finderNegotiationMargin, maxCompanyCashback, finalFinderCashback, description, valueType, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tabela de remuneração não encontrada',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Tabela de remuneração atualizada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Update remuneration table error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar tabela de remuneração',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM remuneration_tables WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tabela de remuneração não encontrada',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      message: 'Tabela de remuneração deletada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Delete remuneration table error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao deletar tabela de remuneração',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

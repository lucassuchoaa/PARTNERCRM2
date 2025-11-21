import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET - Listar todos os NFe uploads
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, file_name as "fileName", partner_id as "partnerId",
        partner_name as "partnerName", month, year,
        file_type as "fileType", file_path as "filePath",
        file_url as "fileUrl", status,
        upload_date as "uploadDate",
        processed_at as "processedAt",
        created_at as "createdAt"
      FROM nfe_uploads
      ORDER BY upload_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching NFe uploads:', error);
    res.status(500).json({ error: 'Erro ao buscar NFe uploads' });
  }
});

// POST - Criar registro de NFe upload
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      fileName, partnerId, partnerName, month, year,
      fileType, filePath, fileUrl, status
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO nfe_uploads (
        file_name, partner_id, partner_name, month, year,
        file_type, file_path, file_url, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, file_name as "fileName", partner_id as "partnerId",
        partner_name as "partnerName", month, year,
        file_type as "fileType", file_path as "filePath",
        file_url as "fileUrl", status,
        upload_date as "uploadDate", created_at as "createdAt"
    `, [fileName, partnerId, partnerName, month, year, fileType || 'pdf', filePath, fileUrl, status || 'pending']);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating NFe upload:', error);
    res.status(500).json({ error: 'Erro ao criar NFe upload' });
  }
});

// PATCH - Atualizar status de processamento
router.patch('/:id/process', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(`
      UPDATE nfe_uploads SET 
        status = $1,
        processed_at = NOW()
      WHERE id = $2
      RETURNING 
        id, file_name as "fileName", partner_id as "partnerId",
        partner_name as "partnerName", month, year,
        file_type as "fileType", status,
        processed_at as "processedAt"
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NFe upload não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error processing NFe upload:', error);
    res.status(500).json({ error: 'Erro ao processar NFe upload' });
  }
});

export default router;

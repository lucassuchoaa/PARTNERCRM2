import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET - Listar uploads (filtrado por role)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let result;

    if (userRole === 'admin') {
      // Admin vê todos os uploads
      result = await pool.query(`
        SELECT
          id, file_name as "fileName", original_name as "originalName",
          file_type as "fileType", file_path as "filePath",
          file_url as "fileUrl", uploaded_by as "uploadedBy",
          partner_id as "partnerId", partner_name as "partnerName",
          reference_month as "referenceMonth", reference_year as "referenceYear",
          size, status, download_count as "downloadCount",
          upload_date as "uploadDate", created_at as "createdAt"
        FROM uploads
        ORDER BY upload_date DESC
      `);
    } else if (userRole === 'manager') {
      // Gerente vê uploads dos parceiros que gerencia + uploads sem parceiro
      result = await pool.query(`
        SELECT
          id, file_name as "fileName", original_name as "originalName",
          file_type as "fileType", file_path as "filePath",
          file_url as "fileUrl", uploaded_by as "uploadedBy",
          partner_id as "partnerId", partner_name as "partnerName",
          reference_month as "referenceMonth", reference_year as "referenceYear",
          size, status, download_count as "downloadCount",
          upload_date as "uploadDate", created_at as "createdAt"
        FROM uploads
        WHERE partner_id IN (SELECT id FROM users WHERE manager_id = $1)
           OR partner_id = $1
           OR partner_id IS NULL
        ORDER BY upload_date DESC
      `, [userId]);
    } else {
      // Parceiro vê apenas seus próprios uploads
      result = await pool.query(`
        SELECT
          id, file_name as "fileName", original_name as "originalName",
          file_type as "fileType", file_path as "filePath",
          file_url as "fileUrl", uploaded_by as "uploadedBy",
          partner_id as "partnerId", partner_name as "partnerName",
          reference_month as "referenceMonth", reference_year as "referenceYear",
          size, status, download_count as "downloadCount",
          upload_date as "uploadDate", created_at as "createdAt"
        FROM uploads
        WHERE partner_id = $1
        ORDER BY upload_date DESC
      `, [userId]);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Erro ao buscar uploads' });
  }
});

// POST - Criar registro de upload
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      fileName, originalName, fileType, filePath,
      fileUrl, uploadedBy, size, status,
      partnerId, partnerName, referenceMonth, referenceYear
    } = req.body;

    const result = await pool.query(`
      INSERT INTO uploads (
        file_name, original_name, file_type, file_path,
        file_url, uploaded_by, size, status,
        partner_id, partner_name, reference_month, reference_year
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING
        id, file_name as "fileName", original_name as "originalName",
        file_type as "fileType", file_path as "filePath",
        file_url as "fileUrl", uploaded_by as "uploadedBy",
        partner_id as "partnerId", partner_name as "partnerName",
        reference_month as "referenceMonth", reference_year as "referenceYear",
        size, status, download_count as "downloadCount",
        upload_date as "uploadDate", created_at as "createdAt"
    `, [fileName, originalName, fileType, filePath, fileUrl, uploadedBy, size, status || 'pending', partnerId, partnerName, referenceMonth, referenceYear]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating upload:', error);
    res.status(500).json({ error: 'Erro ao criar upload' });
  }
});

// PATCH - Incrementar contador de downloads
router.patch('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE uploads SET download_count = download_count + 1
      WHERE id = $1
      RETURNING download_count as "downloadCount"
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Upload não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating download count:', error);
    res.status(500).json({ error: 'Erro ao atualizar contador' });
  }
});

export default router;

import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth-secure';

const router = Router();

// GET - Listar todos os uploads
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, file_name as "fileName", original_name as "originalName",
        file_type as "fileType", file_path as "filePath",
        file_url as "fileUrl", uploaded_by as "uploadedBy",
        size, status, download_count as "downloadCount",
        upload_date as "uploadDate", created_at as "createdAt"
      FROM uploads
      ORDER BY upload_date DESC
    `);
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
      fileUrl, uploadedBy, size, status
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO uploads (
        file_name, original_name, file_type, file_path,
        file_url, uploaded_by, size, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, file_name as "fileName", original_name as "originalName",
        file_type as "fileType", file_path as "filePath",
        file_url as "fileUrl", uploaded_by as "uploadedBy",
        size, status, download_count as "downloadCount",
        upload_date as "uploadDate", created_at as "createdAt"
    `, [fileName, originalName, fileType, filePath, fileUrl, uploadedBy, size, status || 'pending']);
    
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

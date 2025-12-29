import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Configurar diretório de uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'reports');

// Criar diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para upload de relatórios
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const partnerId = (req.body.partnerId || 'unknown').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    const month = (req.body.referenceMonth || '00').toString().padStart(2, '0');
    const year = req.body.referenceYear || '0000';
    const filename = `relatorio-${partnerId}-${month}-${year}-${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF, Excel ou CSV são permitidos'));
    }
  }
});

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

// POST - Upload de arquivo real
router.post('/file', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { partnerId, partnerName, referenceMonth, referenceYear } = req.body;
    const uploadedBy = req.user?.email || 'admin';

    // Gerar URL do arquivo
    const fileUrl = `/uploads/reports/${file.filename}`;

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
    `, [
      file.filename,
      file.originalname,
      path.extname(file.originalname).substring(1).toUpperCase(),
      file.path,
      fileUrl,
      uploadedBy,
      file.size,
      'approved',
      partnerId,
      partnerName,
      referenceMonth ? parseInt(referenceMonth) : null,
      referenceYear ? parseInt(referenceYear) : null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
});

// POST - Criar registro de upload (sem arquivo - para compatibilidade)
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
    `, [fileName, originalName || fileName, fileType, filePath, fileUrl, uploadedBy, size, status || 'pending', partnerId, partnerName, referenceMonth, referenceYear]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating upload:', error);
    res.status(500).json({ error: 'Erro ao criar upload' });
  }
});

// GET - Download de arquivo
router.get('/download/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT file_path as "filePath", file_name as "fileName", original_name as "originalName"
      FROM uploads WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const { filePath, fileName, originalName } = result.rows[0];

    // Incrementar contador de downloads
    await pool.query(`UPDATE uploads SET download_count = download_count + 1 WHERE id = $1`, [id]);

    // Verificar se o arquivo existe
    if (filePath && fs.existsSync(filePath)) {
      res.download(filePath, originalName || fileName);
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Erro ao baixar arquivo' });
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

// DELETE - Remover upload
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem excluir uploads' });
    }

    // Buscar arquivo para deletar do disco
    const fileResult = await pool.query(`SELECT file_path as "filePath" FROM uploads WHERE id = $1`, [id]);

    if (fileResult.rows.length > 0 && fileResult.rows[0].filePath) {
      const filePath = fileResult.rows[0].filePath;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query(`DELETE FROM uploads WHERE id = $1`, [id]);

    res.json({ success: true, message: 'Upload excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ error: 'Erro ao excluir upload' });
  }
});

export default router;

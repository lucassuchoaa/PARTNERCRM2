import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Configurar diretório de uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'nfe');

// Criar diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para upload de NFEs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Formato: partnerId-mes-ano-timestamp.ext
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const partnerId = (req.body.partnerId || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const month = (req.body.month || '00').toString().padStart(2, '0');
    const year = req.body.year || '0000';
    const filename = `nfe-${partnerId}-${month}-${year}-${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/xml', 'text/xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF ou XML são permitidos'));
    }
  }
});

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

// POST - Upload de NFe (com arquivo real)
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const {
      partnerId, partnerName, month, year
    } = req.body;

    if (!partnerId || !month || !year) {
      // Remover arquivo se validação falhar
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'partnerId, month e year são obrigatórios' });
    }

    // Determinar tipo do arquivo
    const fileType = file.mimetype.includes('xml') ? 'xml' : 'pdf';

    // Criar URL do arquivo (pode ser configurado para CDN/S3 posteriormente)
    const fileUrl = `/uploads/nfe/${file.filename}`;

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
    `, [
      file.filename,
      partnerId,
      partnerName || '',
      month,
      year,
      fileType,
      file.path,
      fileUrl,
      'pending'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error uploading NFe:', error);

    // Remover arquivo se houver erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: error.message || 'Erro ao fazer upload de NFe' });
  }
});

// GET - Download de NFe por ID
router.get('/download/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT file_path as "filePath", file_name as "fileName"
      FROM nfe_uploads WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const { filePath, fileName } = result.rows[0];

    // Verificar se o arquivo existe
    if (filePath && fs.existsSync(filePath)) {
      res.download(filePath, fileName);
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
    }
  } catch (error) {
    console.error('Error downloading NFe:', error);
    res.status(500).json({ error: 'Erro ao baixar arquivo' });
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

// DELETE - Remover NFe upload
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem excluir NFe uploads' });
    }

    // Buscar arquivo para deletar do disco
    const fileResult = await pool.query(`SELECT file_path as "filePath" FROM nfe_uploads WHERE id = $1`, [id]);

    if (fileResult.rows.length > 0 && fileResult.rows[0].filePath) {
      const filePath = fileResult.rows[0].filePath;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query(`DELETE FROM nfe_uploads WHERE id = $1`, [id]);

    res.json({ success: true, message: 'NFe upload excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting NFe upload:', error);
    res.status(500).json({ error: 'Erro ao excluir NFe upload' });
  }
});

export default router;

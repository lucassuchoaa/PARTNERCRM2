import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Configurar diretório de uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'support-materials');

// Criar diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para upload de materiais
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Formato: timestamp-nome-original-sanitizado.ext
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    const filename = `${timestamp}-${baseName}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir PDFs, documentos, imagens e vídeos
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/mpeg',
      'video/quicktime'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Envie PDFs, documentos Office, imagens ou vídeos.'));
    }
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM support_materials ORDER BY created_at DESC'
    );
    
    return res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get support materials error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar materiais de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM support_materials WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material de suporte não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Get support material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

// POST com upload de arquivo
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('📤 Upload request received');
    console.log('📤 File:', req.file);
    console.log('📤 Body:', req.body);

    const file = req.file;

    if (!file) {
      console.error('❌ No file in request');
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ File received:', file.filename);
    const { title, category, description, duration } = req.body;

    if (!title || !category) {
      // Remover arquivo se validação falhar
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: title, category',
        timestamp: new Date().toISOString()
      });
    }

    // Determinar tipo baseado no mimetype
    let type = 'document';
    if (file.mimetype.startsWith('image/')) {
      type = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      type = 'video';
    } else if (file.mimetype === 'application/pdf') {
      type = 'pdf';
    }

    // Criar URLs
    const downloadUrl = `/uploads/support-materials/${file.filename}`;
    const viewUrl = downloadUrl; // Mesmo URL para visualização
    const fileSize = `${(file.size / 1024).toFixed(2)} KB`;

    const result = await query(
      `INSERT INTO support_materials (title, category, type, description, download_url, view_url, file_size, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, category, type, description, downloadUrl, viewUrl, fileSize, duration || null]
    );

    console.log('✅ Material saved to database:', result.rows[0]);
    console.log('✅ Download URL:', downloadUrl);
    console.log('✅ File path:', file.path);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Material de suporte criado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Upload support material error:', error);

    // Remover arquivo se houver erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao fazer upload de material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

// POST com URL (método antigo, mantido para compatibilidade)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, type, description, downloadUrl, viewUrl, fileSize, duration } = req.body;

    if (!title || !category || !type) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: title, category, type',
        timestamp: new Date().toISOString()
      });
    }

    const result = await query(
      `INSERT INTO support_materials (title, category, type, description, download_url, view_url, file_size, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, category, type, description, downloadUrl, viewUrl, fileSize, duration]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Material de suporte criado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Create support material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, category, type, description, downloadUrl, viewUrl, fileSize, duration } = req.body;
    
    const result = await query(
      `UPDATE support_materials 
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           type = COALESCE($3, type),
           description = COALESCE($4, description),
           download_url = COALESCE($5, download_url),
           view_url = COALESCE($6, view_url),
           file_size = COALESCE($7, file_size),
           duration = COALESCE($8, duration),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, category, type, description, downloadUrl, viewUrl, fileSize, duration, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material de suporte não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Material de suporte atualizado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Update support material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM support_materials WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Material de suporte não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      message: 'Material de suporte deletado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Delete support material error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao deletar material de suporte',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

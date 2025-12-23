import { Router, Response, Request } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Diretório para uploads de materiais
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'materials');

// Mapeamento de extensões para content types
const contentTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed'
};

// GET - Servir arquivo para download (requer autenticação)
router.get('/:fileName', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(UPLOAD_DIR, fileName);

    console.log('[Material Files] Solicitação de download:', fileName);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error('[Material Files] Arquivo não encontrado:', filePath);
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Obter informações do arquivo
    const stat = fs.statSync(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Extrair nome original (remover timestamp e random string)
    const parts = fileName.split('_');
    let originalName = fileName;
    if (parts.length >= 3) {
      // Remove timestamp e random, mantém o resto
      originalName = parts.slice(2).join('_');
    }

    // Configurar headers para download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);

    // Stream do arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('[Material Files] Download iniciado:', originalName);

  } catch (error: any) {
    console.error('[Material Files] Erro ao servir arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao baixar arquivo',
      message: error.message
    });
  }
});

// GET - Visualizar arquivo (sem forçar download)
router.get('/view/:fileName', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(UPLOAD_DIR, fileName);

    console.log('[Material Files] Solicitação de visualização:', fileName);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error('[Material Files] Arquivo não encontrado:', filePath);
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Obter informações do arquivo
    const stat = fs.statSync(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Configurar headers para visualização inline
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'inline');

    // Stream do arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('[Material Files] Visualização iniciada:', fileName);

  } catch (error: any) {
    console.error('[Material Files] Erro ao visualizar arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao visualizar arquivo',
      message: error.message
    });
  }
});

// GET - Listar arquivos disponíveis
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Garantir que o diretório existe
    if (!fs.existsSync(UPLOAD_DIR)) {
      return res.json({
        success: true,
        files: []
      });
    }

    const files = fs.readdirSync(UPLOAD_DIR);

    const fileList = files.map(fileName => {
      const filePath = path.join(UPLOAD_DIR, fileName);
      const stat = fs.statSync(filePath);
      const ext = path.extname(fileName).toLowerCase();

      return {
        fileName,
        size: stat.size,
        createdAt: stat.birthtime,
        modifiedAt: stat.mtime,
        extension: ext,
        url: `/api/material-files/${fileName}`,
        viewUrl: `/api/material-files/view/${fileName}`
      };
    });

    res.json({
      success: true,
      files: fileList
    });

  } catch (error: any) {
    console.error('[Material Files] Erro ao listar arquivos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar arquivos',
      message: error.message
    });
  }
});

export default router;

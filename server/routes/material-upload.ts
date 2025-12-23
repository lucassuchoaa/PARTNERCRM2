import { Router, Response, Request } from 'express';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Diretório para uploads de materiais
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'materials');

// Garantir que o diretório existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Função para formatar tamanho do arquivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// POST - Upload de arquivo para materiais de apoio
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Material Upload] Iniciando upload de arquivo...');

    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true,
      multiples: false,
      uploadDir: UPLOAD_DIR
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('[Material Upload] Erro ao fazer parse do formulário:', err);
        return res.status(400).json({
          success: false,
          error: 'Erro ao processar upload',
          message: err.message
        });
      }

      // Pegar o primeiro arquivo
      const fileArray = files.file;
      if (!fileArray || (Array.isArray(fileArray) && fileArray.length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }

      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

      try {
        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const originalName = file.originalFilename || 'file';
        const ext = path.extname(originalName);
        const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(ext, '');
        const fileName = `${timestamp}_${randomStr}_${safeName}${ext}`;
        const finalPath = path.join(UPLOAD_DIR, fileName);

        // Mover arquivo para o destino final
        fs.renameSync(file.filepath, finalPath);

        console.log('[Material Upload] Arquivo salvo em:', finalPath);

        // Retornar informações do arquivo
        const fileUrl = `/api/material-files/${fileName}`;

        res.json({
          success: true,
          fileName: fileName,
          originalName: file.originalFilename,
          path: finalPath,
          url: fileUrl,
          downloadUrl: fileUrl,
          size: file.size,
          fileSize: formatFileSize(file.size || 0),
          mimeType: file.mimetype,
          message: 'Arquivo enviado com sucesso!'
        });

      } catch (uploadError: any) {
        console.error('[Material Upload] Erro ao processar upload:', uploadError);

        // Limpar arquivo temporário se existir
        try {
          if (file.filepath && fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath);
          }
        } catch (cleanupErr) {
          console.error('[Material Upload] Erro ao limpar arquivo temporário:', cleanupErr);
        }

        return res.status(500).json({
          success: false,
          error: 'Erro ao processar upload',
          message: uploadError.message
        });
      }
    });

  } catch (error: any) {
    console.error('[Material Upload] Error handling upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload',
      message: error.message
    });
  }
});

// DELETE - Deletar arquivo
router.delete('/:fileName', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
    }

    // Deletar o arquivo
    fs.unlinkSync(filePath);

    console.log('[Material Upload] Arquivo deletado:', filePath);

    res.json({
      success: true,
      message: 'Arquivo deletado com sucesso'
    });

  } catch (error: any) {
    console.error('[Material Upload] Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar arquivo',
      message: error.message
    });
  }
});

export default router;

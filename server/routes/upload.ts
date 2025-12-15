import { Router, Request, Response } from 'express';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
}

// POST - Upload de arquivo
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verificar se o Supabase está configurado
    if (!supabase) {
      return res.status(503).json({
        error: 'Serviço de upload não configurado',
        message: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
      });
    }

    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
      multiples: false
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Erro ao fazer parse do formulário:', err);
        return res.status(400).json({
          error: 'Erro ao processar upload',
          message: err.message
        });
      }

      // Pegar o primeiro arquivo
      const fileArray = files.file;
      if (!fileArray || fileArray.length === 0) {
        return res.status(400).json({
          error: 'Nenhum arquivo enviado'
        });
      }

      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

      try {
        // Ler o arquivo
        const fileContent = fs.readFileSync(file.filepath);

        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.originalFilename || '');
        const fileName = `${timestamp}_${randomStr}${ext}`;

        // Definir o caminho no bucket
        const folder = (fields.folder && fields.folder[0]) || 'general';
        const filePath = `${folder}/${fileName}`;

        // Upload para o Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('partner-files')
          .upload(filePath, fileContent, {
            contentType: file.mimetype || 'application/octet-stream',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro no upload para Supabase:', uploadError);

          // Limpar arquivo temporário
          try {
            fs.unlinkSync(file.filepath);
          } catch (cleanupErr) {
            console.error('Erro ao limpar arquivo temporário:', cleanupErr);
          }

          return res.status(500).json({
            error: 'Erro ao fazer upload do arquivo',
            message: uploadError.message
          });
        }

        // Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
          .from('partner-files')
          .getPublicUrl(filePath);

        // Limpar arquivo temporário
        try {
          fs.unlinkSync(file.filepath);
        } catch (cleanupErr) {
          console.error('Erro ao limpar arquivo temporário:', cleanupErr);
        }

        // Retornar informações do arquivo
        res.json({
          success: true,
          fileName: fileName,
          originalName: file.originalFilename,
          path: filePath,
          url: urlData.publicUrl,
          size: file.size,
          mimeType: file.mimetype,
          folder: folder
        });

      } catch (uploadError: any) {
        console.error('Erro ao processar upload:', uploadError);

        // Limpar arquivo temporário se existir
        try {
          if (file.filepath) {
            fs.unlinkSync(file.filepath);
          }
        } catch (cleanupErr) {
          console.error('Erro ao limpar arquivo temporário:', cleanupErr);
        }

        return res.status(500).json({
          error: 'Erro ao processar upload',
          message: uploadError.message
        });
      }
    });

  } catch (error: any) {
    console.error('Error handling upload:', error);
    res.status(500).json({
      error: 'Erro ao fazer upload',
      message: error.message
    });
  }
});

// DELETE - Deletar arquivo
router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { path: filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        error: 'Caminho do arquivo não fornecido'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Serviço de armazenamento não configurado'
      });
    }

    const { error } = await supabase.storage
      .from('partner-files')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar arquivo:', error);
      return res.status(500).json({
        error: 'Erro ao deletar arquivo',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Arquivo deletado com sucesso'
    });

  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      error: 'Erro ao deletar arquivo',
      message: error.message
    });
  }
});

export default router;

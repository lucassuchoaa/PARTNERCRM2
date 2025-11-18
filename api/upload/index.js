import { getSupabaseClient } from '../_lib/supabaseClient';

/**
 * Upload API - Supabase Storage
 * Handles file uploads to Supabase Storage
 */

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (configError) {
    console.error('Supabase configuration error:', configError);
    return res.status(500).json({
      success: false,
      error: configError.message || 'Supabase não configurado. Verifique as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Vercel.'
    });
  }

  try {
    if (req.method === 'POST') {
      // Parse multipart form data
      const { default: formidable } = await import('formidable');

      const form = formidable({
        maxFileSize: 50 * 1024 * 1024, // 50MB max
        keepExtensions: true,
      });

      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      const file = files.file?.[0] || files.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }

      // Get file details
      const fileName = file.originalFilename || file.newFilename;
      const fileBuffer = await import('fs/promises').then(fs =>
        fs.readFile(file.filepath)
      );

      // Generate unique filename
      const timestamp = Date.now();
      const folder = fields.folder?.[0] || fields.folder || 'general';
      const uniqueFileName = `${folder}/${timestamp}-${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('partner-files')
        .upload(uniqueFileName, fileBuffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('partner-files')
        .getPublicUrl(uniqueFileName);

      return res.status(200).json({
        success: true,
        data: {
          fileName,
          originalName: fileName,
          path: uniqueFileName,
          url: urlData.publicUrl,
          size: file.size,
          mimeType: file.mimetype
        }
      });
    }

    if (req.method === 'DELETE') {
      const { path } = req.query;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: 'Path é obrigatório'
        });
      }

      const { error } = await supabase
        .storage
        .from('partner-files')
        .remove([path]);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Arquivo deletado com sucesso'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Upload API error:', error);

    let errorMessage = 'Erro ao fazer upload do arquivo';

    if (error.message) {
      if (error.message.includes('Bucket not found')) {
        errorMessage = 'Bucket de armazenamento não encontrado. Execute o SQL de configuração do Supabase Storage.';
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'Permissão negada para upload. Verifique as políticas do Storage no Supabase.';
      } else {
        errorMessage = error.message;
      }
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

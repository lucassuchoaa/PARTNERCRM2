import { getSupabaseClient } from '../_lib/supabaseClient';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('support_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const {
        title,
        category,
        type,
        description,
        downloadUrl,
        viewUrl,
        fileSize,
        duration
      } = req.body;

      if (!title || !category || !type) {
        return res.status(400).json({
          success: false,
          error: 'Título, categoria e tipo são obrigatórios'
        });
      }

      const { data, error } = await supabase
        .from('support_materials')
        .insert({
          title,
          category,
          type,
          description: description || null,
          download_url: downloadUrl || null,
          view_url: viewUrl || null,
          file_size: fileSize || null,
          duration: duration || null
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        data
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Support materials API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}


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
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
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

  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
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

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (category !== undefined) updateData.category = category;
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description || null;
      if (downloadUrl !== undefined) updateData.download_url = downloadUrl || null;
      if (viewUrl !== undefined) updateData.view_url = viewUrl || null;
      if (fileSize !== undefined) updateData.file_size = fileSize || null;
      if (duration !== undefined) updateData.duration = duration || null;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('support_materials')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data
      });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('support_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Material de apoio deletado com sucesso'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Support materials [id] API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}


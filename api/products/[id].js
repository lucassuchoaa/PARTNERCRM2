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
      const { name, description, icon, color, isActive, order } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description || null;
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;
      if (isActive !== undefined) updateData.is_active = isActive;
      if (order !== undefined) updateData.order = order;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('products')
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
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Produto deletado com sucesso'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Products [id] API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}


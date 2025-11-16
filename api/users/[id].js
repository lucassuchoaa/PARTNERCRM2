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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { password: _, ...userWithoutPassword } = data;
      return res.status(200).json(userWithoutPassword);
    }

    if (req.method === 'PUT') {
      const { email, name, password, role, managerId, remunerationTableIds, status } = req.body;

      const updateData = {};
      if (email) updateData.email = email.toLowerCase().trim();
      if (name) updateData.name = name;
      if (password) updateData.password = password; // Em produção, fazer hash!
      if (role) updateData.role = role;
      if (managerId !== undefined) updateData.manager_id = managerId || null;
      if (remunerationTableIds) updateData.remuneration_table_ids = remunerationTableIds;
      if (status) updateData.status = status;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const { password: _, ...userWithoutPassword } = data;
      return res.status(200).json({
        success: true,
        data: userWithoutPassword
      });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Users [id] API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}


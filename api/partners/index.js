import { getSupabaseClient } from '../_lib/supabaseClient';

export default async function handler(req, res) {
  // CORS
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
      error: configError.message || 'Supabase não configurado.'
    });
  }

  try {
    if (req.method === 'GET') {
      // Listar apenas usuários com role='partner'
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'partner')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching partners:', error);
        throw error;
      }

      // Transformar dados para formato frontend
      const transformedData = (data || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        bankData: user.bank_data,
        managerId: user.manager_id,
        managerName: user.manager_name,
        remunerationTableIds: user.remuneration_table_ids || [],
        status: user.status,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));

      return res.status(200).json(transformedData);
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Partners API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

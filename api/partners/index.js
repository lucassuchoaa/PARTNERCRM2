import { getSupabaseClient } from '../_lib/supabaseClient';
import { authenticate } from '../_lib/auth';

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
      // Autenticar usuário
      const authResult = await authenticate(req, supabase);

      if (!authResult.authenticated) {
        return res.status(authResult.statusCode).json({
          success: false,
          error: authResult.error
        });
      }

      const { user } = authResult;

      // Listar parceiros com filtro por role
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'partner');

      // Filtrar por role do usuário autenticado
      if (user.role === 'manager') {
        // Gerente: apenas parceiros vinculados a ele
        query = query.eq('manager_id', user.id);
      } else if (user.role === 'partner') {
        // Parceiro: apenas ele mesmo
        query = query.eq('id', user.id);
      }
      // Admin: sem filtro adicional (vê todos)

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

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

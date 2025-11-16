import { createClient } from '@supabase/supabase-js';
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
      // Listar usuários
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      // Criar usuário
      const { email, name, password, role, managerId, remunerationTableIds, status = 'active' } = req.body;

      if (!email || !name || !password || !role) {
        return res.status(400).json({
          success: false,
          error: 'Email, nome, senha e role são obrigatórios'
        });
      }

      const id = Date.now().toString();

      const { data, error } = await supabase
        .from('users')
        .insert({
          id,
          email: email.toLowerCase().trim(),
          name,
          password, // Em produção, fazer hash!
          role,
          manager_id: managerId || null,
          remuneration_table_ids: remunerationTableIds || [],
          status
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          return res.status(409).json({
            success: false,
            error: 'Email já cadastrado'
          });
        }
        throw error;
      }

      // Remover senha do retorno
      const { password: _, ...userWithoutPassword } = data;

      return res.status(201).json({
        success: true,
        data: userWithoutPassword
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}


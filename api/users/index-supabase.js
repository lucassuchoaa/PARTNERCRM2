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

      if (error) {
        console.error('Supabase error fetching users:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Transformar dados para formato frontend
      const transformedData = (data || []).map(user => ({
        ...user,
        remunerationTableIds: user.remuneration_table_ids || [],
        managerId: user.manager_id,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));

      return res.status(200).json(transformedData);
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
        console.error('Supabase error creating user:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        if (error.code === '23505') { // Unique violation
          return res.status(409).json({
            success: false,
            error: 'Email já cadastrado'
          });
        }
        
        // Erro específico de RLS
        if (error.message && error.message.includes('permission denied') || error.message.includes('RLS')) {
          return res.status(500).json({
            success: false,
            error: 'Permissão negada. Verifique as políticas RLS no Supabase. Erro: ' + error.message
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
    console.error('Error stack:', error.stack);
    
    // Mensagens de erro mais específicas
    let errorMessage = 'Erro interno do servidor';
    
    if (error.message) {
      errorMessage = error.message;
      
      // Erros comuns do Supabase
      if (error.message.includes('permission denied') || error.message.includes('RLS')) {
        errorMessage = 'Permissão negada pelo Supabase. Verifique as políticas RLS (Row Level Security) no Supabase.';
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        errorMessage = 'Tabela não encontrada no Supabase. Execute o SQL do arquivo SETUP_SUPABASE.md no SQL Editor do Supabase.';
      } else if (error.message.includes('column') && error.message.includes('does not exist')) {
        errorMessage = 'Coluna não encontrada na tabela. Verifique se o schema da tabela está correto no Supabase.';
      }
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


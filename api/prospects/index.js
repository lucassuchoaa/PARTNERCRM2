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

      // Query baseada em role
      let data, error;

      if (user.role === 'admin') {
        // Admin: todos os prospects
        ({ data, error } = await supabase
          .from('prospects')
          .select('*')
          .order('created_at', { ascending: false }));
      } else if (user.role === 'manager') {
        // Gerente: prospects dos parceiros que ele gerencia
        // Query em duas etapas:
        // 1. Buscar IDs dos parceiros do gerente
        const { data: partnerData } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'partner')
          .eq('manager_id', user.id);

        const partnerIds = (partnerData || []).map(p => p.id);

        // 2. Buscar prospects desses parceiros
        if (partnerIds.length > 0) {
          ({ data, error } = await supabase
            .from('prospects')
            .select('*')
            .in('partner_id', partnerIds)
            .order('created_at', { ascending: false }));
        } else {
          data = [];
        }
      } else if (user.role === 'partner') {
        // Parceiro: apenas seus próprios prospects
        ({ data, error } = await supabase
          .from('prospects')
          .select('*')
          .eq('partner_id', user.id)
          .order('created_at', { ascending: false }));
      } else {
        // Role desconhecido: sem dados
        data = [];
      }

      if (error) {
        console.error('Supabase error fetching prospects:', error);
        throw error;
      }

      // Transformar dados para formato frontend
      const transformedData = (data || []).map(prospect => ({
        id: prospect.id,
        companyName: prospect.company_name,
        contactName: prospect.contact_name,
        email: prospect.email,
        phone: prospect.phone,
        cnpj: prospect.cnpj,
        employeeCount: prospect.employees,
        segment: prospect.segment,
        status: prospect.status,
        submittedAt: prospect.created_at,
        viabilityScore: prospect.viability_score,
        partnerId: prospect.partner_id,
        managerValidation: prospect.manager_validation
      }));

      return res.status(200).json(transformedData);
    }

    if (req.method === 'POST') {
      // Autenticar usuário
      const authResult = await authenticate(req, supabase);

      if (!authResult.authenticated) {
        return res.status(authResult.statusCode).json({
          success: false,
          error: authResult.error
        });
      }

      const { user } = authResult;

      // Apenas parceiros e admins podem criar prospects
      if (user.role !== 'partner' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Apenas parceiros podem criar prospects'
        });
      }

      // Criar prospect
      const {
        companyName,
        contactName,
        email,
        phone,
        cnpj,
        employeeCount,
        segment,
        partnerId,
        status = 'pending'
      } = req.body;

      if (!companyName || !contactName || !email || !partnerId) {
        return res.status(400).json({
          success: false,
          error: 'Dados obrigatórios faltando'
        });
      }

      // Validar que parceiro só pode criar para si mesmo
      if (user.role === 'partner' && partnerId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Parceiro só pode criar prospects para si mesmo'
        });
      }

      const id = Date.now().toString();

      const { data, error } = await supabase
        .from('prospects')
        .insert({
          id,
          company_name: companyName,
          contact_name: contactName,
          email: email.toLowerCase().trim(),
          phone,
          cnpj,
          employees: employeeCount,
          segment,
          partner_id: partnerId,
          status
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating prospect:', error);
        throw error;
      }

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
    console.error('Prospects API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

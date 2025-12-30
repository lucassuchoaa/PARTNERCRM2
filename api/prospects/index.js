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
      error: configError.message || 'Supabase não configurado.'
    });
  }

  try {
    if (req.method === 'GET') {
      // Listar prospects
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

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

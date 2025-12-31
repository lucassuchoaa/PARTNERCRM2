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
        // Admin: todos os clientes
        ({ data, error } = await supabase
          .from('clients')
          .select('*')
          .order('last_updated', { ascending: false }));
      } else if (user.role === 'manager') {
        // Gerente: clientes dos parceiros que ele gerencia
        // Query em duas etapas:
        // 1. Buscar IDs dos parceiros do gerente
        const { data: partnerData } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'partner')
          .eq('manager_id', user.id);

        const partnerIds = (partnerData || []).map(p => p.id);

        // 2. Buscar clientes desses parceiros
        if (partnerIds.length > 0) {
          ({ data, error } = await supabase
            .from('clients')
            .select('*')
            .in('partner_id', partnerIds)
            .order('last_updated', { ascending: false }));
        } else {
          data = [];
        }
      } else if (user.role === 'partner') {
        // Parceiro: apenas seus próprios clientes
        ({ data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('partner_id', user.id)
          .order('last_updated', { ascending: false }));
      } else {
        // Role desconhecido: sem dados
        data = [];
      }

      if (error) {
        console.error('Supabase error fetching clients:', error);
        throw error;
      }

      // Transformar dados para formato frontend
      const transformedData = (data || []).map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        cnpj: client.cnpj,
        cpf: client.cpf,
        status: client.status,
        stage: client.stage,
        temperature: client.temperature,
        totalLives: client.total_lives,
        partnerId: client.partner_id,
        partnerName: client.partner_name,
        contractEndDate: client.contract_end_date,
        registrationDate: client.registration_date,
        lastContactDate: client.last_contact_date,
        lastUpdated: client.last_updated,
        notes: client.notes,
        hubspotId: client.hubspot_id,
        netsuiteId: client.netsuite_id,
        prospectId: client.prospect_id,
        currentProducts: client.current_products,
        potentialProducts: client.potential_products,
        viabilityScore: client.viability_score,
        customRecommendations: client.custom_recommendations,
        potentialProductsWithValues: client.potential_products_with_values
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

      // Apenas parceiros e admins podem criar clientes
      if (user.role !== 'partner' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Apenas parceiros podem criar clientes'
        });
      }

      // Criar client
      const {
        name,
        email,
        phone,
        cnpj,
        cpf,
        status = 'active',
        stage = 'prospeccao',
        temperature = 'cold',
        totalLives = 0,
        partnerId,
        partnerName,
        prospectId
      } = req.body;

      if (!name || !partnerId) {
        return res.status(400).json({
          success: false,
          error: 'Nome e ID do parceiro são obrigatórios'
        });
      }

      // Validar que parceiro só pode criar para si mesmo
      if (user.role === 'partner' && partnerId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Parceiro só pode criar clientes para si mesmo'
        });
      }

      const id = Date.now().toString();

      const { data, error } = await supabase
        .from('clients')
        .insert({
          id,
          name,
          email: email ? email.toLowerCase().trim() : null,
          phone,
          cnpj,
          cpf,
          status,
          stage,
          temperature,
          total_lives: totalLives,
          partner_id: partnerId,
          partner_name: partnerName,
          prospect_id: prospectId
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating client:', error);
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
    console.error('Clients API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

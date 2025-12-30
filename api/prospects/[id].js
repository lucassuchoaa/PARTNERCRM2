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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID do prospect é obrigatório'
      });
    }

    if (req.method === 'GET') {
      // Buscar prospect específico
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching prospect:', error);
        throw error;
      }

      // Transformar dados para formato frontend
      const transformedData = {
        id: data.id,
        companyName: data.company_name,
        contactName: data.contact_name,
        email: data.email,
        phone: data.phone,
        cnpj: data.cnpj,
        employeeCount: data.employees,
        segment: data.segment,
        status: data.status,
        submittedAt: data.created_at,
        viabilityScore: data.viability_score,
        partnerId: data.partner_id,
        managerValidation: data.manager_validation
      };

      return res.status(200).json(transformedData);
    }

    if (req.method === 'PUT') {
      // Atualizar prospect
      const prospectData = req.body;

      const updateData = {
        company_name: prospectData.companyName,
        contact_name: prospectData.contactName,
        email: prospectData.email,
        phone: prospectData.phone,
        cnpj: prospectData.cnpj,
        employees: prospectData.employeeCount,
        segment: prospectData.segment,
        status: prospectData.status,
        viability_score: prospectData.viabilityScore,
        partner_id: prospectData.partnerId,
        manager_validation: prospectData.managerValidation
      };

      const { data, error } = await supabase
        .from('prospects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating prospect:', error);
        throw error;
      }

      return res.status(200).json({
        success: true,
        data
      });
    }

    if (req.method === 'DELETE') {
      // Deletar prospect
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting prospect:', error);
        throw error;
      }

      return res.status(200).json({
        success: true,
        message: 'Prospect deletado com sucesso'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Prospect API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

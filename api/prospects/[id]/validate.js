import { getSupabaseClient } from '../../_lib/supabaseClient';

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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
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
    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { isApproved, validatedBy, validationNotes, status } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID do prospect é obrigatório'
        });
      }

      const managerValidation = {
        isValidated: true,
        validatedBy: validatedBy || 'Gerente',
        validatedAt: new Date().toISOString(),
        notes: validationNotes || '',
        isApproved: isApproved !== false
      };

      const { data, error } = await supabase
        .from('prospects')
        .update({
          status: status || (isApproved ? 'validated' : 'rejected'),
          manager_validation: managerValidation
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error validating prospect:', error);
        throw error;
      }

      return res.status(200).json({
        success: true,
        data
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Prospect validation API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

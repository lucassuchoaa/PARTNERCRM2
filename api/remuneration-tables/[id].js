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
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();
  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      const {
        employeeRangeStart,
        employeeRangeEnd,
        finderNegotiationMargin,
        maxCompanyCashback,
        finalFinderCashback,
        description,
        valueType
      } = req.body;

      const updateData = {};
      if (employeeRangeStart !== undefined) updateData.employee_range_start = employeeRangeStart;
      if (employeeRangeEnd !== undefined) updateData.employee_range_end = employeeRangeEnd || null;
      if (finderNegotiationMargin !== undefined) updateData.finder_negotiation_margin = finderNegotiationMargin;
      if (maxCompanyCashback !== undefined) updateData.max_company_cashback = maxCompanyCashback;
      if (finalFinderCashback !== undefined) updateData.final_finder_cashback = finalFinderCashback;
      if (description !== undefined) updateData.description = description || null;
      if (valueType !== undefined) updateData.value_type = valueType;

      const { data, error } = await supabase
        .from('remuneration_tables')
        .update(updateData)
        .eq('id', parseInt(id))
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data
      });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('remuneration_tables')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Tabela de remuneração deletada com sucesso'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Remuneration tables [id] API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}


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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('remuneration_tables')
        .select('*')
        .order('employee_range_start', { ascending: true });

      if (error) throw error;

      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const {
        employeeRangeStart,
        employeeRangeEnd,
        finderNegotiationMargin,
        maxCompanyCashback,
        finalFinderCashback,
        description,
        valueType = 'percentage'
      } = req.body;

      if (!employeeRangeStart || !finderNegotiationMargin || !maxCompanyCashback || !finalFinderCashback) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: employeeRangeStart, finderNegotiationMargin, maxCompanyCashback, finalFinderCashback'
        });
      }

      const { data, error } = await supabase
        .from('remuneration_tables')
        .insert({
          employee_range_start: employeeRangeStart,
          employee_range_end: employeeRangeEnd || null,
          finder_negotiation_margin: finderNegotiationMargin,
          max_company_cashback: maxCompanyCashback,
          final_finder_cashback: finalFinderCashback,
          description: description || null,
          value_type: valueType
        })
        .select()
        .single();

      if (error) throw error;

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
    console.error('Remuneration tables API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}


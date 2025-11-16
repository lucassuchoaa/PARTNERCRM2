import { supabaseAdmin } from '../_lib/supabaseClient.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error: 'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
    })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pricing_plans')
      .select('*')
      .order('order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar pricing_plans do Supabase:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json(
      data.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        basePrice: row.base_price,
        includedUsers: row.included_users,
        additionalUserPrice: row.additional_user_price,
        features: row.features || [],
        isActive: row.is_active,
        order: row.order,
      })),
    )
  } catch (error) {
    console.error('Erro inesperado em /api/pricingPlans:', error)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}



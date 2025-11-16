import { supabaseAdmin } from '../_lib/supabaseClient.js'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
    body,
  } = req

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error: 'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
    })
  }

  if (method === 'PUT') {
    try {
      const payload = {
        name: body.name,
        description: body.description,
        base_price: body.basePrice,
        included_users: body.includedUsers,
        additional_user_price: body.additionalUserPrice,
        features: body.features,
        is_active: body.isActive,
        order: body.order,
      }

      const { data, error } = await supabaseAdmin
        .from('pricing_plans')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('Erro ao atualizar pricing_plans no Supabase:', error)
        return res.status(500).json({ success: false, error: error.message })
      }

      return res.status(200).json({
        success: true,
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          basePrice: data.base_price,
          includedUsers: data.included_users,
          additionalUserPrice: data.additional_user_price,
          features: data.features || [],
          isActive: data.is_active,
          order: data.order,
        },
      })
    } catch (error) {
      console.error('Erro inesperado em PUT /api/pricingPlans/[id]:', error)
      return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  }

  res.setHeader('Allow', ['PUT'])
  return res.status(405).json({ success: false, error: 'Method not allowed' })
}



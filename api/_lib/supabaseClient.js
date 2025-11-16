import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin = null

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Em ambiente local sem Supabase configurado, apenas logamos um aviso.
  // Em produção (Vercel), essas variáveis DEVEM estar configuradas.
  console.warn(
    'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.'
  )
} else {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}

export function getSupabaseClient() {
  if (!supabaseAdmin) {
    const error = new Error('Supabase client não inicializado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do Vercel.')
    error.code = 'SUPABASE_NOT_CONFIGURED'
    throw error
  }
  return supabaseAdmin
}

export { supabaseAdmin }



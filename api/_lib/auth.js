/**
 * Biblioteca de autenticação para Vercel Serverless Functions
 * Extrai userId do token JWT enviado pelo frontend
 */

/**
 * Extrai userId do token Bearer
 * Token format: "access_<userId>_<timestamp>"
 * @param {Request} req - Request object
 * @returns {string|null} - userId ou null se inválido
 */
export function extractUserFromToken(req) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Parse token: access_<userId>_<timestamp>
    const parts = token.split('_');
    if (parts.length < 3 || parts[0] !== 'access') {
      return null;
    }

    const userId = parts[1]; // User ID
    const timestamp = parseInt(parts[2], 10);

    // Verificar expiração (1 hora = 3600000ms)
    const now = Date.now();
    if (now - timestamp > 3600000) {
      throw new Error('Token expired');
    }

    return userId;
  } catch (error) {
    console.error('Token extraction error:', error);
    return null;
  }
}

/**
 * Busca dados completos do usuário do Supabase
 * @param {SupabaseClient} supabase - Cliente Supabase
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object|null>} - Dados do usuário ou null
 */
export async function getUserFromDatabase(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, manager_id, status')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      managerId: data.manager_id,
      status: data.status
    };
  } catch (error) {
    console.error('Database user lookup error:', error);
    return null;
  }
}

/**
 * Middleware de autenticação para serverless functions
 * @param {Request} req - Request object
 * @param {SupabaseClient} supabase - Cliente Supabase
 * @returns {Promise<Object>} - { authenticated, user?, error?, statusCode? }
 */
export async function authenticate(req, supabase) {
  const userId = extractUserFromToken(req);

  if (!userId) {
    return {
      authenticated: false,
      error: 'No valid token provided',
      statusCode: 401
    };
  }

  const user = await getUserFromDatabase(supabase, userId);

  if (!user) {
    return {
      authenticated: false,
      error: 'User not found',
      statusCode: 401
    };
  }

  if (user.status !== 'active') {
    return {
      authenticated: false,
      error: 'Account inactive',
      statusCode: 403
    };
  }

  return {
    authenticated: true,
    user
  };
}

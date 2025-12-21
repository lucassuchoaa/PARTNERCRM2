import jwt from 'jsonwebtoken';

// IMPORTANTE: Definir no .env ou Replit Secrets
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'CHANGE_THIS_IN_PRODUCTION_TO_RANDOM_256_BITS';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'CHANGE_THIS_REFRESH_SECRET_TOO';

const ACCESS_TOKEN_EXPIRY = '1h';   // 1 hora
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 dias

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Cria um token JWT seguro com assinatura criptográfica
 */
export function createToken(type: 'access' | 'refresh', user: { id: string; email: string; role: string }): string {
  const secret = type === 'access' ? JWT_ACCESS_SECRET : JWT_REFRESH_SECRET;
  const expiresIn = type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type
  };

  return jwt.sign(payload, secret, {
    expiresIn,
    algorithm: 'HS256',
    issuer: 'partners-crm',
    audience: 'partners-crm-api'
  });
}

/**
 * Verifica e decodifica um token JWT
 * @throws Error se token inválido ou expirado
 */
export function verifyToken(token: string, type: 'access' | 'refresh'): TokenPayload {
  const secret = type === 'access' ? JWT_ACCESS_SECRET : JWT_REFRESH_SECRET;

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'partners-crm',
      audience: 'partners-crm-api'
    }) as TokenPayload;

    // Verificar que o tipo bate
    if (decoded.type !== type) {
      throw new Error(`Token type mismatch: expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    } else {
      throw error;
    }
  }
}

/**
 * Extrai token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verifica se os secrets estão configurados adequadamente
 */
export function validateJWTSecrets(): void {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.includes('CHANGE_THIS')) {
      throw new Error('JWT_ACCESS_SECRET não configurado corretamente em produção!');
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('CHANGE_THIS')) {
      throw new Error('JWT_REFRESH_SECRET não configurado corretamente em produção!');
    }

    // Verificar comprimento mínimo (256 bits = 32 bytes = 64 hex chars)
    if (process.env.JWT_ACCESS_SECRET.length < 32) {
      console.warn('⚠️  JWT_ACCESS_SECRET muito curto! Recomendado: mínimo 32 caracteres');
    }
  } else {
    console.warn('⚠️  Usando JWT secrets padrão em desenvolvimento. Configure em produção!');
  }
}

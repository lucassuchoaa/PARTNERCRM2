import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
  };
}

/**
 * Middleware de autenticação usando JWT
 * Verifica token JWT e anexa dados do usuário em req.user
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extrair token do header Authorization
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido',
        code: 'NO_TOKEN',
        message: 'Você precisa estar autenticado para acessar este recurso'
      });
      return;
    }

    // Verificar e decodificar token JWT
    let decoded;
    try {
      decoded = verifyToken(token, 'access');
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN',
        details: error.message,
        message: 'Faça login novamente'
      });
      return;
    }

    // Buscar usuário atualizado no banco de dados
    const result = await pool.query(
      `SELECT id, email, name, first_name, last_name, role, status
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
        message: 'Sua conta não existe mais'
      });
      return;
    }

    const user = result.rows[0];

    // Verificar se usuário está ativo
    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        error: 'Conta inativa',
        code: 'ACCOUNT_INACTIVE',
        message: 'Sua conta foi desativada. Entre em contato com o administrador.'
      });
      return;
    }

    // Anexar dados do usuário na requisição
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || user.first_name || 'Usuário',
      role: user.role,
      status: user.status
    };

    // Prosseguir para próximo middleware/rota
    next();

  } catch (error: any) {
    console.error('[AUTH MIDDLEWARE] ❌ Erro na autenticação:', error);

    res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware de autorização por role
 * Verifica se usuário tem a role necessária
 *
 * Uso: authorize(['admin', 'manager'])
 */
export function authorize(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(
        `[AUTH] ⚠️  Acesso negado: ${req.user.email} (role: ${req.user.role}) ` +
        `tentou acessar recurso que requer: ${allowedRoles.join(' ou ')}`
      );

      res.status(403).json({
        success: false,
        error: 'Permissão negada',
        code: 'FORBIDDEN',
        message: `Você não tem permissão para acessar este recurso. Necessário: ${allowedRoles.join(' ou ')}`
      });
      return;
    }

    // Usuário tem permissão
    next();
  };
}

/**
 * Middleware opcional de autenticação
 * Se token estiver presente, autentica
 * Se não, continua sem autenticar (req.user = undefined)
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    // Sem token, continuar sem autenticar
    next();
    return;
  }

  try {
    const decoded = verifyToken(token, 'access');

    const result = await pool.query(
      'SELECT id, email, name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0 && result.rows[0].status === 'active') {
      const user = result.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      };
    }
  } catch (error) {
    // Token inválido, mas é opcional, então apenas ignorar
    console.warn('[AUTH] Token inválido em rota opcional');
  }

  next();
}

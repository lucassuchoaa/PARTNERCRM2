import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter para endpoints de autenticação (login)
 * Previne ataques de força bruta
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas
  message: {
    error: 'Muitas tentativas de login',
    details: 'Você excedeu o limite de tentativas. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`

  // Usar IP + User-Agent para identificar cliente
  keyGenerator: (req: Request) => {
    return `${req.ip}-${req.headers['user-agent']}`;
  },

  // Handler customizado
  handler: (req: Request, res: Response) => {
    console.warn(`⚠️ Rate limit excedido para IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);

    res.status(429).json({
      error: 'Muitas tentativas de login',
      details: 'Você excedeu o limite de tentativas. Tente novamente em 15 minutos.',
      retryAfter: 900 // segundos
    });
  },

  // Pular rate limit em desenvolvimento (opcional)
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'development' && req.headers['x-bypass-rate-limit'] === 'true';
  }
});

/**
 * Rate limiter geral para todas as APIs
 * Previne spam e DDoS application-layer
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições
  message: {
    error: 'Muitas requisições',
    details: 'Você excedeu o limite de requisições. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) => {
    // Usar userId se autenticado, senão IP
    return (req as any).user?.id || req.ip;
  },

  handler: (req: Request, res: Response) => {
    console.warn(`⚠️ API rate limit excedido para ${(req as any).user?.email || req.ip}`);

    res.status(429).json({
      error: 'Muitas requisições',
      details: 'Você excedeu o limite de requisições. Tente novamente em alguns minutos.'
    });
  }
});

/**
 * Rate limiter para criação de recursos (prospects, clients, etc)
 * Previne spam de criação
 */
export const createResourceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // Máximo 50 criações por hora
  message: {
    error: 'Muitas criações',
    details: 'Você excedeu o limite de criação de registros. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: false, // Contar todas as tentativas, mesmo bem-sucedidas

  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip;
  }
});

/**
 * Rate limiter para APIs externas (CNPJ, HubSpot, etc)
 * Previne custos excessivos
 */
export const externalAPILimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // Máximo 100 consultas externas por hora
  message: {
    error: 'Limite de consultas externas excedido',
    details: 'Você atingiu o limite de consultas de CNPJ. Tente novamente em 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip;
  }
});

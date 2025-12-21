import { z } from 'zod';

/**
 * Schema de validação para criação de prospect
 */
export const createProspectSchema = z.object({
  companyName: z.string()
    .min(1, 'Nome da empresa é obrigatório')
    .max(255, 'Nome da empresa muito longo')
    .trim(),

  contactName: z.string()
    .min(1, 'Nome do contato é obrigatório')
    .max(255, 'Nome do contato muito longo')
    .trim(),

  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .toLowerCase()
    .trim(),

  phone: z.string()
    .transform(val => val ? val.replace(/[^\d+]/g, '') : '') // Remove formatação
    .refine(val => !val || val.length >= 10, 'Telefone deve ter no mínimo 10 dígitos')
    .optional(),

  cnpj: z.string()
    .regex(/^\d{14}$/, 'CNPJ deve conter exatamente 14 dígitos')
    .refine(validateCNPJ, 'CNPJ inválido'),

  employees: z.string()
    .max(50, 'Campo funcionários inválido'),

  segment: z.enum([
    'Tecnologia',
    'Comércio',
    'Indústria',
    'Serviços',
    'Saúde',
    'Educação',
    'Agronegócio',
    'Construção',
    'Transporte',
    'Outros'
  ], {
    errorMap: () => ({ message: 'Segmento inválido' })
  }),

  partnerId: z.string()
    .min(1, 'Partner ID é obrigatório')
    .max(255, 'Partner ID muito longo')
    .optional()
});

/**
 * Schema para atualização de prospect
 */
export const updateProspectSchema = createProspectSchema.partial().extend({
  status: z.enum(['pending', 'validated', 'in-analysis', 'approved', 'rejected']).optional(),
  adminValidation: z.object({
    isApproved: z.boolean().optional(),
    validatedBy: z.string().optional(),
    validatedAt: z.string().datetime().optional(),
    notes: z.string().max(1000).optional()
  }).optional()
});

/**
 * Schema para validação/aprovação de prospect
 */
export const validateProspectSchema = z.object({
  isApproved: z.boolean(),
  validatedBy: z.string().min(1).max(255),
  validationNotes: z.string().max(1000).optional(),
  status: z.enum(['validated', 'in-analysis', 'approved', 'rejected'])
});

/**
 * Schema para criação de cliente
 */
export const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255).toLowerCase().optional(),
  phone: z.string().regex(/^[+]?[0-9\s()-]{10,20}$/).optional(),
  cnpj: z.string().regex(/^\d{14}$/).optional(),
  cpf: z.string().regex(/^\d{11}$/).optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  stage: z.enum(['prospeccao', 'negociacao', 'fechamento', 'ativo', 'inativo']).optional(),
  temperature: z.enum(['cold', 'warm', 'hot']).optional(),
  totalLives: z.number().int().min(0).optional(),
  partnerId: z.string().min(1).max(255).optional(),
  partnerName: z.string().max(255).optional(),
  notes: z.string().max(2000).optional()
});

/**
 * Schema para atualização de cliente
 */
export const updateClientSchema = createClientSchema.partial();

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

/**
 * Schema para refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório')
});

/**
 * Schema para criação de usuário
 */
export const createUserSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  name: z.string().min(1).max(255),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  role: z.enum(['admin', 'manager', 'partner']),
  managerId: z.string().min(1).max(255).optional(),
  status: z.enum(['active', 'inactive']).optional()
});

/**
 * Validação de CNPJ (algoritmo oficial)
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove formatação
  cnpj = cnpj.replace(/[^\d]/g, '');

  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 5;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (digit !== parseInt(cnpj.charAt(12))) {
    return false;
  }

  // Validação do segundo dígito verificador
  sum = 0;
  weight = 6;

  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return digit === parseInt(cnpj.charAt(13));
}

/**
 * Sanitiza CNPJ removendo formatação
 */
export function sanitizeCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, '');
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e > (previne XSS básico)
    .substring(0, 1000); // Limita tamanho
}

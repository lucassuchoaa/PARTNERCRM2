/**
 * Input Validation Middleware using Zod
 *
 * Provides type-safe validation for API requests
 */

import { z, ZodSchema, ZodError } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Validate request body against Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (
    req: VercelRequest,
    res: VercelResponse,
    next: (validatedData: T) => Promise<void>
  ): Promise<void | VercelResponse> => {
    try {
      const validatedData = schema.parse(req.body);
      await next(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          timestamp: new Date().toISOString()
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (
    req: VercelRequest,
    res: VercelResponse,
    next: (validatedData: T) => Promise<void>
  ): Promise<void | VercelResponse> => {
    try {
      const validatedData = schema.parse(req.query);
      await next(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          timestamp: new Date().toISOString()
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        timestamp: new Date().toISOString()
      });
    }
  };
}

// ============================================================================
// Common Validation Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'HTML content is required'),
  from: z.string().email().optional()
});

export const notificationEmailSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'success', 'warning', 'error', 'report_available', 'admin_message'])
});

export const geminiRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional()
});

export const salesPitchSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  clientContext: z.string().optional()
});

export const hubspotContactSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional()
});

export const hubspotValidateProspectSchema = z.object({
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  phone: z.string().optional()
});

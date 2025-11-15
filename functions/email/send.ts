/**
 * Email Send API Endpoint (Resend Proxy)
 *
 * Securely sends emails using Resend API
 * API key is stored server-side only
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse, errorResponse } from '../_middleware/errorHandler';
import { requireAuth } from '../_middleware/auth';
import { apiRateLimit } from '../_middleware/rateLimit';
import { validateBody, emailSchema } from '../_middleware/validation';
import { EmailRequest, EmailResponse, JWTPayload } from '../../shared/types';

// Initialize Resend with server-side API key
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('⚠️  RESEND_API_KEY not set in environment variables');
}

const resend = new Resend(RESEND_API_KEY || 'dummy-key-for-build');

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  if (!RESEND_API_KEY) {
    return errorResponse('Email service not configured', 503, 'SERVICE_UNAVAILABLE');
  }

  await apiRateLimit(req, res, async () => {
    await requireAuth(async (req, res, user: JWTPayload) => {
      await validateBody(emailSchema)(req, res, async (validatedData: EmailRequest) => {
        try {
          const { to, subject, html, from } = validatedData;

          const defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'noreply@partnerscrm.com';

          const result = await resend.emails.send({
            from: from || defaultFrom,
            to: Array.isArray(to) ? to : [to],
            subject,
            html
          });

          const response: EmailResponse = {
            success: true,
            messageId: result.data?.id
          };

          res.status(200).json(successResponse(response, 'Email sent successfully'));
        } catch (error: any) {
          console.error('Resend API error:', error);
          return errorResponse(
            'Failed to send email',
            500,
            'EMAIL_SEND_FAILED'
          );
        }
      });
    })(req, res);
  });
}

export default withCORS(withErrorHandler(handler));

/**
 * Notification Email API Endpoint
 *
 * Sends notification emails using predefined templates
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse, errorResponse } from '../_middleware/errorHandler';
import { requireAuth } from '../_middleware/auth';
import { apiRateLimit } from '../_middleware/rateLimit';
import { validateBody, notificationEmailSchema } from '../_middleware/validation';
import { NotificationEmailRequest, EmailResponse, JWTPayload } from '../../shared/types';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY || 'dummy-key-for-build');

/**
 * Generate notification email HTML template
 */
function generateNotificationTemplate(data: NotificationEmailRequest): string {
  const appUrl = process.env.FRONTEND_URL || 'https://partnerscrm.com';

  const typeColors = {
    info: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    report_available: '#8B5CF6',
    admin_message: '#6366F1'
  };

  const typeLabels = {
    info: 'Informação',
    success: 'Sucesso',
    warning: 'Aviso',
    error: 'Erro',
    report_available: 'Relatório Disponível',
    admin_message: 'Mensagem Administrativa'
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Partners CRM</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0;">Portal de Parceiros</p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: ${typeColors[data.type]}; color: white; padding: 10px 15px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
          <strong>${typeLabels[data.type]}</strong>
        </div>

        <h2 style="color: #333; margin-bottom: 15px;">${data.title}</h2>

        <p style="margin-bottom: 20px;">Olá, <strong>${data.recipientName}</strong>!</p>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;">${data.message}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Acessar Dashboard</a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
          Este é um email automático do Partners CRM. Não responda a este email.
        </p>
      </div>
    </body>
    </html>
  `;
}

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
      await validateBody(notificationEmailSchema)(req, res, async (validatedData: NotificationEmailRequest) => {
        try {
          const emailHtml = generateNotificationTemplate(validatedData);
          const defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'noreply@partnerscrm.com';

          const result = await resend.emails.send({
            from: defaultFrom,
            to: validatedData.recipientEmail,
            subject: `Partners CRM - ${validatedData.title}`,
            html: emailHtml
          });

          const response: EmailResponse = {
            success: true,
            messageId: result.data?.id
          };

          res.status(200).json(successResponse(response, 'Notification email sent successfully'));
        } catch (error: any) {
          console.error('Resend API error:', error);
          return errorResponse('Failed to send notification email', 500, 'EMAIL_SEND_FAILED');
        }
      });
    })(req, res);
  });
}

export default withCORS(withErrorHandler(handler));

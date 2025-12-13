import { Router, Response } from 'express';
import { Resend } from 'resend';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const resend = new Resend(process.env.RESEND_API_KEY);
const defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'noreply@partnerscrm.com';
const appUrl = process.env.FRONTEND_URL || process.env.VERCEL_URL || 'https://partnerscrm.com';

interface NotificationEmailData {
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'report_available' | 'admin_message';
}

function generateNotificationTemplate(data: NotificationEmailData): string {
  const typeColors: Record<string, { bg: string; border: string }> = {
    info: { bg: '#EBF5FF', border: '#3B82F6' },
    success: { bg: '#ECFDF5', border: '#10B981' },
    warning: { bg: '#FFFBEB', border: '#F59E0B' },
    error: { bg: '#FEF2F2', border: '#EF4444' },
    report_available: { bg: '#F5F3FF', border: '#8B5CF6' },
    admin_message: { bg: '#EEF2FF', border: '#6366F1' }
  };

  const colors = typeColors[data.type] || typeColors.info;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Partners CRM</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                    <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">${data.title}</h2>
                  </div>

                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Olá <strong>${data.recipientName}</strong>,
                  </p>

                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    ${data.message}
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                          Acessar Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    Este email foi enviado automaticamente pelo Partners CRM.<br>
                    Por favor, não responda a este email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// POST - Enviar email genérico
router.post('/send', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { to, subject, html, from } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: to, subject, html'
      });
    }

    const response = await resend.emails.send({
      from: from || defaultFrom,
      to,
      subject,
      html
    });

    res.json({
      success: true,
      data: {
        success: true,
        messageId: response.data?.id
      }
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao enviar email'
    });
  }
});

// POST - Enviar email de notificação
router.post('/notification', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { recipientEmail, recipientName, title, message, type } = req.body as NotificationEmailData;

    if (!recipientEmail || !recipientName || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: recipientEmail, recipientName, title, message, type'
      });
    }

    const html = generateNotificationTemplate({ recipientEmail, recipientName, title, message, type });

    const response = await resend.emails.send({
      from: defaultFrom,
      to: recipientEmail,
      subject: `Partners CRM - ${title}`,
      html
    });

    res.json({
      success: true,
      data: {
        success: true,
        messageId: response.data?.id
      }
    });
  } catch (error: any) {
    console.error('Error sending notification email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao enviar email de notificação'
    });
  }
});

export default router;

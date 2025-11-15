/**
 * Email Service (Secure Backend Version)
 *
 * Replaces direct Resend API calls with secure backend proxy
 */

import { apiClient } from './client';
import { EmailRequest, EmailResponse, NotificationEmailRequest } from '../../../shared/types';

/**
 * Send email via backend API (secure)
 */
export async function sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
  try {
    const response = await apiClient.post<{ success: boolean; data: EmailResponse }>('/email/send', emailData);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to send email';
    throw new Error(message);
  }
}

/**
 * Send notification email via backend API
 */
export async function sendNotificationEmail(data: NotificationEmailRequest): Promise<EmailResponse> {
  try {
    const response = await apiClient.post<{ success: boolean; data: EmailResponse }>('/email/notification', data);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to send notification email';
    throw new Error(message);
  }
}

/**
 * Send report available email
 */
export async function sendReportAvailableEmail(
  recipientEmail: string,
  recipientName: string,
  reportMonth: string,
  reportYear: number,
  downloadUrl?: string
): Promise<EmailResponse> {
  return sendNotificationEmail({
    recipientEmail,
    recipientName,
    title: `Relatório ${reportMonth}/${reportYear} Disponível`,
    message: `Seu relatório de ${reportMonth}/${reportYear} está disponível para download no dashboard.${downloadUrl ? ` Você também pode fazer o download direto clicando no botão abaixo.` : ''}`,
    type: 'report_available'
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  recipientName: string,
  temporaryPassword?: string
): Promise<EmailResponse> {
  return sendNotificationEmail({
    recipientEmail,
    recipientName,
    title: 'Bem-vindo ao Partners CRM',
    message: `Sua conta no Partners CRM foi criada com sucesso. Agora você pode acessar todas as funcionalidades da plataforma.${temporaryPassword ? `\n\nSenha temporária: ${temporaryPassword}\n⚠️ Recomendamos alterar sua senha no primeiro acesso.` : ''}`,
    type: 'info'
  });
}

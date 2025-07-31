import { Resend } from 'resend';

// Configuração do Resend
// No frontend, usamos import.meta.env para acessar variáveis de ambiente
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || 'your-resend-api-key');

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface NotificationEmailData {
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'report_available' | 'admin_message';
}

class EmailService {
  private defaultFrom = import.meta.env.VITE_DEFAULT_FROM_EMAIL || 'noreply@somapay.com';
  private appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

  /**
   * Envia um email usando o Resend
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await resend.emails.send({
        from: emailData.from || this.defaultFrom,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      });

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao enviar email',
      };
    }
  }

  /**
   * Envia notificação por email
   */
  async sendNotificationEmail(data: NotificationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailTemplate = this.generateNotificationTemplate(data);
    
    return this.sendEmail({
      to: data.recipientEmail,
      subject: `Somapay - ${data.title}`,
      html: emailTemplate,
    });
  }

  /**
   * Envia email de relatório disponível
   */
  async sendReportAvailableEmail(
    recipientEmail: string,
    recipientName: string,
    reportMonth: string,
    reportYear: number,
    downloadUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailTemplate = this.generateReportTemplate({
      recipientName,
      reportMonth,
      reportYear,
      downloadUrl,
    });

    return this.sendEmail({
      to: recipientEmail,
      subject: `Somapay - Relatório ${reportMonth}/${reportYear} Disponível`,
      html: emailTemplate,
    });
  }

  /**
   * Envia email de boas-vindas para novos usuários
   */
  async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string,
    temporaryPassword?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailTemplate = this.generateWelcomeTemplate({
      recipientName,
      temporaryPassword,
    });

    return this.sendEmail({
      to: recipientEmail,
      subject: 'Bem-vindo ao Somapay Dashboard',
      html: emailTemplate,
    });
  }

  /**
   * Gera template HTML para notificações
   */
  private generateNotificationTemplate(data: NotificationEmailData): string {
    const typeColors = {
      info: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      report_available: '#8B5CF6',
      admin_message: '#6366F1',
    };

    const typeLabels = {
      info: 'Informação',
      success: 'Sucesso',
      warning: 'Aviso',
      error: 'Erro',
      report_available: 'Relatório Disponível',
      admin_message: 'Mensagem Administrativa',
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
          <h1 style="color: white; margin: 0; font-size: 28px;">Somapay</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Dashboard de Parceiros</p>
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
            <a href="${this.appUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Acessar Dashboard</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
            Este é um email automático do sistema Somapay. Não responda a este email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gera template HTML para relatórios
   */
  private generateReportTemplate(data: {
    recipientName: string;
    reportMonth: string;
    reportYear: number;
    downloadUrl?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Disponível</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Somapay</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Dashboard de Parceiros</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: #8B5CF6; color: white; padding: 10px 15px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
            <strong>📊 Relatório Disponível</strong>
          </div>
          
          <h2 style="color: #333; margin-bottom: 15px;">Seu relatório está pronto!</h2>
          
          <p style="margin-bottom: 20px;">Olá, <strong>${data.recipientName}</strong>!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">Seu relatório de <strong>${data.reportMonth}/${data.reportYear}</strong> está disponível para download no dashboard.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.appUrl}" style="background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Acessar Dashboard</a>
            ${data.downloadUrl ? `<a href="${data.downloadUrl}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Direto</a>` : ''}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
            Este é um email automático do sistema Somapay. Não responda a este email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gera template HTML para boas-vindas
   */
  private generateWelcomeTemplate(data: {
    recipientName: string;
    temporaryPassword?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Somapay</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo ao Somapay!</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0;">Dashboard de Parceiros</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">Sua conta foi criada com sucesso!</h2>
          
          <p style="margin-bottom: 20px;">Olá, <strong>${data.recipientName}</strong>!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;">Sua conta no Somapay Dashboard foi criada com sucesso. Agora você pode acessar todas as funcionalidades da plataforma.</p>
            ${data.temporaryPassword ? `<p style="margin: 10px 0 0 0;"><strong>Senha temporária:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${data.temporaryPassword}</code></p><p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">⚠️ Recomendamos alterar sua senha no primeiro acesso.</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.appUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Acessar Dashboard</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666; text-align: center; margin: 0;">
            Este é um email automático do sistema Somapay. Não responda a este email.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
export default emailService;
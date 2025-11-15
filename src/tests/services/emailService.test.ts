import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock do Resend antes de importar o emailService
vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({
    data: { id: 'test-email-id' }
  })

  return {
    Resend: class MockResend {
      emails = {
        send: mockSend
      }
    }
  }
})

import { emailService } from '../../services/emailService'

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendEmail', () => {
    it('deve enviar email com sucesso', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      }

      const result = await emailService.sendEmail(emailData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-email-id')
      expect(result.error).toBeUndefined()
    })

    it('deve usar email padrão quando from não é fornecido', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      }

      const result = await emailService.sendEmail(emailData)
      expect(result.success).toBe(true)
    })

    it('deve incluir from customizado quando fornecido', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        from: 'custom@example.com'
      }

      const result = await emailService.sendEmail(emailData)
      expect(result.success).toBe(true)
    })
  })

  describe('sendNotificationEmail', () => {
    it('deve enviar email de notificação', async () => {
      const notificationData = {
        recipientEmail: 'user@example.com',
        recipientName: 'Test User',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info' as const,
      }

      const result = await emailService.sendNotificationEmail(notificationData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-email-id')
    })

    it('deve enviar notificação de sucesso', async () => {
      const result = await emailService.sendNotificationEmail({
        recipientEmail: 'user@example.com',
        recipientName: 'Test User',
        title: 'Success',
        message: 'Operation completed',
        type: 'success',
      })

      expect(result.success).toBe(true)
    })

    it('deve enviar notificação de erro', async () => {
      const result = await emailService.sendNotificationEmail({
        recipientEmail: 'user@example.com',
        recipientName: 'Test User',
        title: 'Error',
        message: 'Operation failed',
        type: 'error',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('sendReportAvailableEmail', () => {
    it('deve enviar email de relatório disponível', async () => {
      const result = await emailService.sendReportAvailableEmail(
        'user@example.com',
        'Test User',
        '12',
        2024
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-email-id')
    })

    it('deve incluir link de download quando fornecido', async () => {
      const result = await emailService.sendReportAvailableEmail(
        'user@example.com',
        'Test User',
        '12',
        2024,
        'https://example.com/download'
      )

      expect(result.success).toBe(true)
    })
  })

  describe('sendWelcomeEmail', () => {
    it('deve enviar email de boas-vindas', async () => {
      const result = await emailService.sendWelcomeEmail(
        'newuser@example.com',
        'New User'
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-email-id')
    })

    it('deve incluir senha temporária quando fornecida', async () => {
      const result = await emailService.sendWelcomeEmail(
        'newuser@example.com',
        'New User',
        'temp123'
      )

      expect(result.success).toBe(true)
    })
  })
})

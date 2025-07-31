import { API_URL } from '../config/api'

interface NetSuiteConfig {
  accountId: string
  consumerKey: string
  consumerSecret: string
  tokenId: string
  tokenSecret: string
  baseUrl: string
}

interface NetSuiteReport {
  id: string
  name: string
  type: 'financial' | 'operational' | 'custom'
  partnerId: number
  period: {
    startDate: string
    endDate: string
  }
  data: any
  generatedAt: string
}

interface ReportUploadResult {
  success: boolean
  reportId?: string
  fileName?: string
  error?: string
}

class NetSuiteService {
  private config: NetSuiteConfig
  private baseHeaders: Record<string, string>

  constructor() {
    this.config = {
      accountId: process.env.NETSUITE_ACCOUNT_ID || '',
      consumerKey: process.env.NETSUITE_CONSUMER_KEY || '',
      consumerSecret: process.env.NETSUITE_CONSUMER_SECRET || '',
      tokenId: process.env.NETSUITE_TOKEN_ID || '',
      tokenSecret: process.env.NETSUITE_TOKEN_SECRET || '',
      baseUrl: process.env.NETSUITE_BASE_URL || 'https://rest.netsuite.com'
    }

    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  /**
   * Gera assinatura OAuth 1.0 para autenticação com NetSuite
   */
  private generateOAuthSignature(method: string, url: string, params: Record<string, string>): string {
    // Implementação simplificada - em produção, use uma biblioteca OAuth
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = Math.random().toString(36).substring(2, 15)
    
    const oauthParams = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_token: this.config.tokenId,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0',
      ...params
    }

    // Nota: Esta é uma implementação simplificada
    // Em produção, use uma biblioteca como 'oauth-1.0a' para gerar a assinatura correta
    const signature = 'PLACEHOLDER_SIGNATURE'
    
    return `OAuth realm="${this.config.accountId}",` +
           `oauth_consumer_key="${this.config.consumerKey}",` +
           `oauth_token="${this.config.tokenId}",` +
           `oauth_signature_method="HMAC-SHA1",` +
           `oauth_timestamp="${timestamp}",` +
           `oauth_nonce="${nonce}",` +
           `oauth_version="1.0",` +
           `oauth_signature="${signature}"`
  }

  /**
   * Faz uma requisição autenticada para a API do NetSuite
   */
  private async makeNetSuiteRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: any): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`
    const authHeader = this.generateOAuthSignature(method, url, {})

    const response = await fetch(url, {
      method,
      headers: {
        ...this.baseHeaders,
        'Authorization': authHeader
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      throw new Error(`NetSuite API Error: ${response.status} - ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Gera relatório financeiro para um parceiro específico
   */
  async generateFinancialReport(partnerId: number, startDate: string, endDate: string): Promise<NetSuiteReport> {
    try {
      // Buscar dados do parceiro no sistema local
      const partnerResponse = await fetch(`${API_URL}/partners/${partnerId}`)
      const partner = await partnerResponse.json()

      if (!partner) {
        throw new Error(`Parceiro com ID ${partnerId} não encontrado`)
      }

      // Fazer requisição para NetSuite para obter dados financeiros
      const reportData = await this.makeNetSuiteRequest(
        `/services/rest/record/v1/customrecord_financial_report?q=partner_id:${partnerId} AND date:[${startDate}..${endDate}]`
      )

      const report: NetSuiteReport = {
        id: `report_${Date.now()}`,
        name: `Relatório Financeiro - ${partner.name} - ${startDate} a ${endDate}`,
        type: 'financial',
        partnerId,
        period: { startDate, endDate },
        data: reportData,
        generatedAt: new Date().toISOString()
      }

      // Salvar relatório no sistema local
      await this.saveReportLocally(report)

      return report
    } catch (error) {
      console.error('Erro ao gerar relatório financeiro:', error)
      throw error
    }
  }

  /**
   * Gera relatório operacional para um parceiro específico
   */
  async generateOperationalReport(partnerId: number, startDate: string, endDate: string): Promise<NetSuiteReport> {
    try {
      const partnerResponse = await fetch(`${API_URL}/partners/${partnerId}`)
      const partner = await partnerResponse.json()

      if (!partner) {
        throw new Error(`Parceiro com ID ${partnerId} não encontrado`)
      }

      // Fazer requisição para NetSuite para obter dados operacionais
      const reportData = await this.makeNetSuiteRequest(
        `/services/rest/record/v1/customrecord_operational_report?q=partner_id:${partnerId} AND date:[${startDate}..${endDate}]`
      )

      const report: NetSuiteReport = {
        id: `report_${Date.now()}`,
        name: `Relatório Operacional - ${partner.name} - ${startDate} a ${endDate}`,
        type: 'operational',
        partnerId,
        period: { startDate, endDate },
        data: reportData,
        generatedAt: new Date().toISOString()
      }

      await this.saveReportLocally(report)
      return report
    } catch (error) {
      console.error('Erro ao gerar relatório operacional:', error)
      throw error
    }
  }

  /**
   * Faz upload de um relatório para o NetSuite
   */
  async uploadReportToNetSuite(reportId: string, fileData: File | Blob, fileName: string): Promise<ReportUploadResult> {
    try {
      // Converter arquivo para base64
      const base64Data = await this.fileToBase64(fileData)
      
      // Fazer upload para NetSuite
      const uploadResponse = await this.makeNetSuiteRequest(
        '/services/rest/record/v1/file',
        'POST',
        {
          name: fileName,
          content: base64Data,
          folder: 'partner_reports',
          description: `Relatório gerado automaticamente - ID: ${reportId}`
        }
      )

      // Atualizar registro local com informações do upload
      await fetch(`${API_URL}/partner_reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportId,
          fileName,
          netsuiteFileId: uploadResponse.id,
          uploadedAt: new Date().toISOString(),
          status: 'uploaded'
        })
      })

      return {
        success: true,
        reportId: uploadResponse.id,
        fileName
      }
    } catch (error) {
      console.error('Erro ao fazer upload para NetSuite:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Baixa um relatório do NetSuite
   */
  async downloadReportFromNetSuite(netsuiteFileId: string): Promise<Blob> {
    try {
      const fileData = await this.makeNetSuiteRequest(
        `/services/rest/record/v1/file/${netsuiteFileId}`
      )

      // Converter base64 de volta para blob
      const binaryString = atob(fileData.content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      return new Blob([bytes], { type: 'application/pdf' })
    } catch (error) {
      console.error('Erro ao baixar relatório do NetSuite:', error)
      throw error
    }
  }

  /**
   * Sincroniza relatórios entre o sistema local e NetSuite
   */
  async syncReports(): Promise<void> {
    try {
      // Buscar relatórios locais não sincronizados
      const localReportsResponse = await fetch(`${API_URL}/partner_reports?synced=false`)
      const localReports = await localReportsResponse.json()

      // Buscar relatórios do NetSuite
      const netsuiteReports = await this.makeNetSuiteRequest(
        '/services/rest/record/v1/customrecord_partner_report'
      )

      // Sincronizar relatórios locais para NetSuite
      for (const report of localReports) {
        if (!report.netsuiteId) {
          // Upload para NetSuite se ainda não foi enviado
          const uploadResult = await this.uploadReportToNetSuite(
            report.id,
            new Blob([JSON.stringify(report.data)]),
            `${report.fileName}.json`
          )

          if (uploadResult.success) {
            // Atualizar registro local
            await fetch(`${API_URL}/partner_reports/${report.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...report,
                netsuiteId: uploadResult.reportId,
                synced: true
              })
            })
          }
        }
      }

      console.log('Sincronização de relatórios concluída')
    } catch (error) {
      console.error('Erro na sincronização de relatórios:', error)
      throw error
    }
  }

  /**
   * Salva relatório no sistema local
   */
  private async saveReportLocally(report: NetSuiteReport): Promise<void> {
    await fetch(`${API_URL}/partner_reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: report.id,
        fileName: report.name,
        partnerId: report.partnerId,
        referenceMonth: new Date(report.period.startDate).getMonth() + 1,
        referenceYear: new Date(report.period.startDate).getFullYear(),
        uploadDate: report.generatedAt,
        fileType: 'json',
        size: JSON.stringify(report.data).length,
        status: 'generated',
        data: report.data,
        synced: false
      })
    })
  }

  /**
   * Converte arquivo para base64
   */
  private fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove o prefixo data:type;base64,
      }
      reader.onerror = error => reject(error)
    })
  }

  /**
   * Testa a conexão com NetSuite
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeNetSuiteRequest('/services/rest/record/v1/account')
      return true
    } catch (error) {
      console.error('Erro ao testar conexão com NetSuite:', error)
      return false
    }
  }
}

export const netsuiteService = new NetSuiteService()
export default netsuiteService
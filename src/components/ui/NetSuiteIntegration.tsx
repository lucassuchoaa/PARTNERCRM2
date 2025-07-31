import { useState, useEffect } from 'react'
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CogIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { getCurrentUser } from '../../services/auth'
import netsuiteService from '../../services/netsuiteService'
import { API_URL } from '../../config/api'

interface Partner {
  id: number
  name: string
  email: string
  cnpj: string
  status: string
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
  generatedAt: string
  status: 'generated' | 'uploaded' | 'synced'
  netsuiteId?: string
}

interface ConnectionStatus {
  connected: boolean
  lastChecked: string
  error?: string
}

export default function NetSuiteIntegration() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [reports, setReports] = useState<NetSuiteReport[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastChecked: ''
  })
  const [loading, setLoading] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null)
  const [reportType, setReportType] = useState<'financial' | 'operational'>('financial')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Inicialização assíncrona correta
    const initializeComponent = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        // Definir status de conexão padrão
        setConnectionStatus({
          connected: false,
          lastChecked: new Date().toLocaleString('pt-BR'),
          error: 'NetSuite não configurado (modo demonstração)'
        })
        
        // Carregar dados de forma assíncrona
        await loadUserAndData()
      } catch (error) {
        console.error('Erro na inicialização:', error)
        showMessage('error', 'Erro ao inicializar componente')
      }
    }
    
    initializeComponent()
  }, [])

  const loadUserAndData = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)

      // Carregar parceiros
      const partnersResponse = await fetch(`${API_URL}/partners`)
      if (partnersResponse.ok) {
        const partnersData = await partnersResponse.json()
        setPartners(partnersData)
      } else {
        console.warn('Erro ao carregar parceiros:', partnersResponse.status)
        setPartners([])
      }

      // Carregar relatórios existentes
      const reportsResponse = await fetch(`${API_URL}/partner_reports`)
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData)
      } else {
        console.warn('Erro ao carregar relatórios:', reportsResponse.status)
        setReports([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showMessage('error', 'Erro ao carregar dados: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    }
  }

  const checkNetSuiteConnection = async () => {
    try {
      setLoading(true)
      // Simulação de teste de conexão por enquanto
      const isConnected = false // await netsuiteService.testConnection()
      setConnectionStatus({
        connected: isConnected,
        lastChecked: new Date().toLocaleString('pt-BR'),
        error: isConnected ? undefined : 'NetSuite não configurado (modo demonstração)'
      })
    } catch (error) {
      setConnectionStatus({
        connected: false,
        lastChecked: new Date().toLocaleString('pt-BR'),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!selectedPartner) {
      showMessage('error', 'Selecione um parceiro')
      return
    }

    try {
      setLoading(true)
      let report

      if (reportType === 'financial') {
        report = await netsuiteService.generateFinancialReport(
          selectedPartner,
          dateRange.startDate,
          dateRange.endDate
        )
      } else {
        report = await netsuiteService.generateOperationalReport(
          selectedPartner,
          dateRange.startDate,
          dateRange.endDate
        )
      }

      setReports(prev => [{ ...report, status: 'generated' as const }, ...prev])
      showMessage('success', 'Relatório gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      showMessage('error', 'Erro ao gerar relatório: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const uploadReportToNetSuite = async (reportId: string) => {
    try {
      setLoading(true)
      const report = reports.find(r => r.id === reportId)
      if (!report) {
        showMessage('error', 'Relatório não encontrado')
        return
      }

      // Criar blob com dados do relatório
      const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const fileName = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`

      const result = await netsuiteService.uploadReportToNetSuite(reportId, reportBlob, fileName)

      if (result.success) {
        // Atualizar status do relatório
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, status: 'uploaded', netsuiteId: result.reportId }
            : r
        ))
        showMessage('success', 'Relatório enviado para NetSuite com sucesso!')
      } else {
        showMessage('error', 'Erro ao enviar relatório: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      showMessage('error', 'Erro ao fazer upload: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile) {
      showMessage('error', 'Selecione um arquivo')
      return
    }

    try {
      setLoading(true)
      const reportId = `manual_upload_${Date.now()}`
      const result = await netsuiteService.uploadReportToNetSuite(reportId, uploadFile, uploadFile.name)

      if (result.success) {
        showMessage('success', 'Arquivo enviado para NetSuite com sucesso!')
        setUploadFile(null)
        // Recarregar relatórios
        loadUserAndData()
      } else {
        showMessage('error', 'Erro ao enviar arquivo: ' + result.error)
      }
    } catch (error) {
      console.error('Erro ao fazer upload manual:', error)
      showMessage('error', 'Erro ao fazer upload: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const syncReports = async () => {
    try {
      setLoading(true)
      await netsuiteService.syncReports()
      showMessage('success', 'Sincronização concluída com sucesso!')
      loadUserAndData()
    } catch (error) {
      console.error('Erro na sincronização:', error)
      showMessage('error', 'Erro na sincronização: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
      case 'synced':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'generated':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  if (!currentUser) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Integração NetSuite</h1>
        <p className="text-gray-600">Geração automática de relatórios e sincronização com NetSuite</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Status da Conexão</h2>
          <button
            onClick={checkNetSuiteConnection}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verificar
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`h-3 w-3 rounded-full ${
            connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {connectionStatus.connected ? 'Conectado' : 'Desconectado'}
          </span>
          <span className="text-xs text-gray-400">
            Última verificação: {connectionStatus.lastChecked}
          </span>
        </div>
        {connectionStatus.error && (
          <p className="text-sm text-red-600 mt-2">{connectionStatus.error}</p>
        )}
      </div>

      {/* Report Generation */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Gerar Relatório</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parceiro</label>
            <select
              value={selectedPartner || ''}
              onChange={(e) => setSelectedPartner(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Selecione um parceiro</option>
              {partners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'financial' | 'operational')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="financial">Financeiro</option>
              <option value="operational">Operacional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <button
          onClick={generateReport}
          disabled={loading || !connectionStatus.connected}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <DocumentTextIcon className="h-4 w-4 mr-2" />
          Gerar Relatório
        </button>
      </div>

      {/* Manual Upload */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Manual</h2>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            accept=".pdf,.json,.xlsx,.csv"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <button
            onClick={handleFileUpload}
            disabled={loading || !uploadFile || !connectionStatus.connected}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Enviar
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Relatórios</h2>
          <button
            onClick={syncReports}
            disabled={loading || !connectionStatus.connected}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerado em</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(report.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{report.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{report.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.period ? 
                      `${new Date(report.period.startDate).toLocaleDateString('pt-BR')} - ${new Date(report.period.endDate).toLocaleDateString('pt-BR')}` 
                      : 'Período não definido'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {report.status === 'generated' && (
                      <button
                        onClick={() => uploadReportToNetSuite(report.id)}
                        disabled={loading || !connectionStatus.connected}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                      >
                        <CloudArrowUpIcon className="h-4 w-4" />
                      </button>
                    )}
                    {report.netsuiteId && (
                      <span className="text-green-600 ml-2">✓ NetSuite</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum relatório encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
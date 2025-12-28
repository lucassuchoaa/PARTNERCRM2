import { useState, useEffect } from 'react'
import { DocumentArrowDownIcon, PaperAirplaneIcon, CalendarIcon, DocumentArrowUpIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { getCurrentUser } from '../../services/auth'
import { sendNotificationEmail } from '../../services/api/emailService'
import { API_URL } from '../../config/api'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'

interface PartnerReport {
  id: string
  partnerId: string
  partnerName?: string
  month: number
  year: number
  totalReferrals: number
  approvedReferrals: number
  rejectedReferrals: number
  pendingReferrals: number
  totalCommission: number
  paidCommission: number
  pendingCommission: number
  createdAt: string
  updatedAt: string
}

interface NfeUpload {
  id: number
  fileName: string
  partnerId: number
  partnerName: string
  month: string
  year: number
  fileType: string
  filePath?: string
  fileUrl?: string
  status: string
  uploadDate: string
  processedAt?: string
}

interface User {
  id: number
  email: string
  name: string
  role: string
}

export default function Reports() {
  const [reports, setReports] = useState<PartnerReport[]>([])
  const [nfeUploads, setNfeUploads] = useState<NfeUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [dateFilter, setDateFilter] = useState<'current' | 'last' | 'all' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [filteredReports, setFilteredReports] = useState<PartnerReport[]>([])

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Buscar usuário atual
        const user = await getCurrentUser()
        setCurrentUser(user)

        if (user) {
          // Buscar relatórios de parceiros
          await fetchPartnerReports()
          // Buscar NFE uploads
          await fetchNfeUploads()
        }
      } catch (error) {
        console.error('Erro ao inicializar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  // Filtrar relatórios baseado no filtro de data selecionado
  useEffect(() => {
    const filterReports = () => {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1 // 1-12
      const currentYear = currentDate.getFullYear()

      let filtered = [...reports]

      switch (dateFilter) {
        case 'current':
          filtered = reports.filter(report =>
            report.month === currentMonth && report.year === currentYear
          )
          break
        case 'last':
          const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
          const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
          filtered = reports.filter(report =>
            report.month === lastMonth && report.year === lastMonthYear
          )
          break
        case 'custom':
          if (customStartDate && customEndDate) {
            const startDate = new Date(customStartDate)
            const endDate = new Date(customEndDate)
            endDate.setMonth(endDate.getMonth() + 1) // Incluir o mês final completo

            filtered = reports.filter(report => {
              const reportDate = new Date(report.year, report.month - 1)
              return reportDate >= startDate && reportDate < endDate
            })
          }
          break
        case 'all':
        default:
          filtered = reports
      }

      setFilteredReports(filtered)
    }

    filterReports()
  }, [reports, dateFilter, customStartDate, customEndDate])

  const fetchPartnerReports = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/partner_reports`)

      if (!response.ok) {
        console.error('Erro ao buscar relatórios')
        setReports([])
        return
      }

      const data = await response.json()
      setReports(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao buscar relatórios de parceiros:', error)
      setReports([])
    }
  }

  const fetchNfeUploads = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/nfe_uploads`)

      if (!response.ok) {
        console.error('Erro ao buscar NFe uploads')
        setNfeUploads([])
        return
      }

      const data = await response.json()
      setNfeUploads(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao buscar NFe uploads:', error)
      setNfeUploads([])
    }
  }

  const handleDownloadReport = async (report: PartnerReport) => {
    if (!currentUser) {
      alert('Usuário não autenticado')
      return
    }

    // Verificar se existe NFE upload para este período
    const nfeUpload = nfeUploads.find(nfe =>
      nfe.partnerId === currentUser.id &&
      parseInt(nfe.month) === report.month &&
      nfe.year === report.year &&
      (nfe.status === 'processed' || nfe.status === 'available')
    )

    if (!nfeUpload || !nfeUpload.fileUrl) {
      alert(`Relatório de ${monthNames[report.month - 1]} ${report.year} não está disponível para download.`)
      return
    }

    // Fazer download do arquivo
    try {
      const response = await fetch(nfeUpload.fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nfeUpload.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao baixar relatório:', error)
      alert('Erro ao baixar relatório. Tente novamente.')
    }
  }

  const handleSendInvoice = async (report: PartnerReport) => {
    try {
      if (!currentUser) {
        alert('Usuário não autenticado')
        return
      }

      // Enviar email com a nota fiscal
      const emailResult = await sendNotificationEmail({
        recipientEmail: currentUser.email,
        recipientName: currentUser.name,
        title: `Nota Fiscal - ${monthNames[report.month - 1]}/${report.year}`,
        message: `Sua nota fiscal referente ao período de ${monthNames[report.month - 1]}/${report.year} foi processada.\n\nResumo:\n- Total de Indicações: ${report.totalReferrals}\n- Aprovadas: ${report.approvedReferrals}\n- Comissão Total: ${formatCurrency(report.totalCommission)}\n- Comissão Paga: ${formatCurrency(report.paidCommission)}`,
        type: 'info'
      })

      if (emailResult.success) {
        alert(`Nota fiscal de ${monthNames[report.month - 1]}/${report.year} enviada com sucesso por email!`)
      } else {
        throw new Error(emailResult.error || 'Erro ao enviar email')
      }
    } catch (error) {
      console.error('Erro ao enviar nota fiscal:', error)
      alert('Erro ao enviar nota fiscal. Tente novamente.')
    }
  }

  const handleNfeUpload = async (event: React.ChangeEvent<HTMLInputElement>, report: PartnerReport) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'application/xml', 'text/xml']
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, envie apenas arquivos PDF ou XML.')
      return
    }

    // Validar tamanho do arquivo (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 10MB.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('partnerId', currentUser.id.toString())
      formData.append('partnerName', currentUser.name)
      formData.append('month', report.month.toString())
      formData.append('year', report.year.toString())
      formData.append('fileType', file.type.includes('xml') ? 'xml' : 'pdf')

      // Upload para o servidor
      const response = await fetchWithAuth(`${API_URL}/nfe_uploads`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro ao fazer upload')
      }

      const result = await response.json()

      // Atualizar lista de NFE uploads
      await fetchNfeUploads()

      alert(`NFe de ${monthNames[report.month - 1]} ${report.year} enviada com sucesso!`)
    } catch (error) {
      console.error('Erro ao enviar NFe:', error)
      alert('Erro ao enviar NFe. Tente novamente.')
    }

    // Limpar input
    event.target.value = ''
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const hasNfeUploadForReport = (report: PartnerReport): boolean => {
    return nfeUploads.some(nfe =>
      nfe.partnerId === currentUser?.id &&
      parseInt(nfe.month) === report.month &&
      nfe.year === report.year
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Relatórios Mensais</h1>
          <p className="mt-2 text-sm text-gray-700">
            Visualize e gerencie os relatórios de produção mensal e notas fiscais.
          </p>
        </div>
      </div>

      {/* Filtros de Data */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4 flex-wrap gap-4">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filtrar por período:</span>
          </div>

          <div className="flex space-x-4 flex-wrap gap-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="dateFilter"
                value="all"
                checked={dateFilter === 'all'}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="mr-2 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Todos</span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="dateFilter"
                value="current"
                checked={dateFilter === 'current'}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="mr-2 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Mês Atual</span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="dateFilter"
                value="last"
                checked={dateFilter === 'last'}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="mr-2 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Mês Passado</span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="dateFilter"
                value="custom"
                checked={dateFilter === 'custom'}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="mr-2 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Personalizado</span>
            </label>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex space-x-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                <input
                  type="month"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                <input
                  type="month"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        Período
                      </div>
                    </th>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parceiro
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Indicações
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aprovadas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comissão Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comissão Paga
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                    {currentUser?.role === 'partner' && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enviar NFe
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {monthNames[report.month - 1]} {report.year}
                        </div>
                      </td>
                      {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {(report as any).partnerName || 'N/A'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.totalReferrals}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">
                          {report.approvedReferrals}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(report.totalCommission)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">
                          {formatCurrency(report.paidCommission)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                            Baixar
                          </button>
                          <button
                            onClick={() => handleSendInvoice(report)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                            Enviar
                          </button>
                        </div>
                      </td>
                      {currentUser?.role === 'partner' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasNfeUploadForReport(report) ? (
                            <span className="inline-flex items-center px-3 py-2 text-sm text-blue-700 bg-blue-100 rounded-md">
                              ✓ Enviada
                            </span>
                          ) : (
                            <label className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                              <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                              Enviar
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.xml"
                                onChange={(e) => handleNfeUpload(e, report)}
                              />
                            </label>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum relatório encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {dateFilter === 'custom' && (!customStartDate || !customEndDate)
              ? 'Selecione as datas de início e fim para filtrar os relatórios.'
              : 'Nenhum relatório encontrado para o período selecionado.'}
          </p>
        </div>
      )}
    </div>
  )
}

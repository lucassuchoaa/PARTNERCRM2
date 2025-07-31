import { useState, useEffect } from 'react'
import { DocumentArrowDownIcon, PaperAirplaneIcon, CalendarIcon, DocumentArrowUpIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { getCurrentUser } from '../../services/auth'
import { emailService } from '../../services/emailService'
import { API_URL } from '../../config/api'

interface MonthlyReport {
  id: number
  month: string
  year: number
  totalRevenue: number
  totalClients: number
  totalLives: number
  reportGenerated: boolean
  invoiceSent: boolean
  nfeUploaded: boolean
  nfeUploadDate?: string
}

interface PartnerReport {
  id: number
  fileName: string
  partnerId: number
  partnerName: string
  referenceMonth: number
  referenceYear: number
  uploadDate: string
  fileType: string
  size: number
  status: string
}

interface User {
  id: number
  email: string
  name: string
  role: string
}

export default function Reports() {
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [partnerReports, setPartnerReports] = useState<PartnerReport[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [dateFilter, setDateFilter] = useState<'current' | 'last' | 'custom'>('current')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [filteredReports, setFilteredReports] = useState<MonthlyReport[]>([])

  useEffect(() => {
    const initializeData = async () => {
      // Buscar usuário atual
      const user = await getCurrentUser()
      setCurrentUser(user)
      
      if (user) {
        // Buscar relatórios específicos do parceiro
        await fetchPartnerReports(user.id)
      }
      
      // Simular dados de relatórios mensais
      const generateReports = () => {
        const months = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
        
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth()
        
        const reportsData: MonthlyReport[] = []
        
        // Gerar relatórios para os últimos 12 meses
        for (let i = 11; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12
          const year = currentMonth - i < 0 ? currentYear - 1 : currentYear
          
          reportsData.push({
            id: i + 1,
            month: months[monthIndex],
            year: year,
            totalRevenue: Math.floor(Math.random() * 50000) + 10000,
            totalClients: Math.floor(Math.random() * 20) + 5,
            totalLives: Math.floor(Math.random() * 500) + 100,
            reportGenerated: i < 10, // Últimos 10 meses têm relatórios
            invoiceSent: i < 8, // Últimos 8 meses têm notas fiscais enviadas
            nfeUploaded: i < 6, // Últimos 6 meses têm NFe enviadas
            nfeUploadDate: i < 6 ? new Date(year, monthIndex, 15).toISOString() : undefined
          })
        }
        
        setReports(reportsData.reverse())
        setLoading(false)
      }

      generateReports()
    }

    initializeData()
  }, [])

  // Filtrar relatórios baseado no filtro de data selecionado
  useEffect(() => {
    const filterReports = () => {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      let filtered = [...reports]
      
      switch (dateFilter) {
        case 'current':
          filtered = reports.filter(report => 
            report.month === getMonthName(currentMonth) && report.year === currentYear
          )
          break
        case 'last':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          filtered = reports.filter(report => 
            report.month === getMonthName(lastMonth) && report.year === lastMonthYear
          )
          break
        case 'custom':
          if (customStartDate && customEndDate) {
            const startDate = new Date(customStartDate)
            const endDate = new Date(customEndDate)
            filtered = reports.filter(report => {
              const reportDate = new Date(report.year, getMonthIndex(report.month))
              return reportDate >= startDate && reportDate <= endDate
            })
          }
          break
        default:
          filtered = reports
      }
      
      setFilteredReports(filtered)
    }
    
    filterReports()
  }, [reports, dateFilter, customStartDate, customEndDate])

  const getMonthName = (monthIndex: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[monthIndex]
  }

  const getMonthIndex = (monthName: string) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months.indexOf(monthName)
  }

  const fetchPartnerReports = async (partnerId: number) => {
    try {
      const response = await fetch(`${API_URL}/partner_reports`)
      const allReports = await response.json()
      
      // Filtrar relatórios apenas do parceiro logado
      const userReports = allReports.filter((report: PartnerReport) => report.partnerId === partnerId)
      setPartnerReports(userReports)
    } catch (error) {
      console.error('Erro ao buscar relatórios do parceiro:', error)
      setPartnerReports([])
    }
  }

  const handleDownloadReport = (reportId: number, month: string, year: number) => {
    if (!currentUser) {
      alert('Usuário não autenticado')
      return
    }

    // Verificar se existe relatório disponível para este parceiro
    const availableReport = partnerReports.find(report => {
      return report.referenceMonth === (new Date().getMonth() - (12 - reportId)) + 1 && 
             report.referenceYear === year &&
             report.status === 'available'
    })

    if (!availableReport) {
      alert(`Relatório de ${month} ${year} não está disponível para download.`)
      return
    }
    
    // Simular download do relatório
    console.log(`Baixando relatório: ${availableReport.fileName}`)
    
    // Aqui você implementaria a lógica real de download
    alert(`Baixando relatório: ${availableReport.fileName}`)
  }

  const handleSendInvoice = async (reportId: number, month: string, year: number) => {
    try {
      // Encontrar o relatório
      const report = reports.find(r => r.id === reportId)
      if (!report || !currentUser) {
        alert('Relatório ou usuário não encontrado')
        return
      }

      // Enviar email com a nota fiscal
      const emailResult = await emailService.sendNotificationEmail({
        recipientEmail: currentUser.email,
        recipientName: currentUser.name,
        title: `Nota Fiscal - ${month}/${year}`,
        message: `Sua nota fiscal referente ao período de ${month}/${year} foi processada e está sendo enviada. Em breve você receberá o documento oficial por email.`,
        type: 'info'
      })

      if (emailResult.success) {
        // Atualizar o estado para marcar como enviado
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, invoiceSent: true }
            : report
        ))
        
        alert(`Nota fiscal de ${month}/${year} enviada com sucesso por email!`)
      } else {
        throw new Error(emailResult.error || 'Erro ao enviar email')
      }
    } catch (error) {
      console.error('Erro ao enviar nota fiscal:', error)
      alert('Erro ao enviar nota fiscal. Tente novamente.')
    }
  }

  const handleNfeUpload = async (event: React.ChangeEvent<HTMLInputElement>, reportId: number, month: string, year: number) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'application/xml', 'text/xml']
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, envie apenas arquivos PDF ou XML.')
      return
    }

    try {
      // Simular upload para o servidor
      const formData = new FormData()
      formData.append('file', file)
      formData.append('partnerId', currentUser?.id.toString() || '')
      formData.append('partnerName', currentUser?.name || '')
      formData.append('month', month)
      formData.append('year', year.toString())
      formData.append('uploadDate', new Date().toISOString())

      // Criar nome do arquivo: parceiro-mes-ano-data_upload
      const uploadDate = new Date().toISOString().split('T')[0]
      const fileName = `${currentUser?.name.replace(/\s+/g, '_')}-${month}-${year}-${uploadDate}.${file.name.split('.').pop()}`
      
      console.log(`Uploading NFe: ${fileName}`)
      
      // Simular requisição para API
      // await fetch('http://localhost:3001/nfe-uploads', {
      //   method: 'POST',
      //   body: formData
      // })

      // Atualizar estado local
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              nfeUploaded: true, 
              nfeUploadDate: new Date().toISOString() 
            }
          : report
      ))

      alert(`NFe de ${month} ${year} enviada com sucesso!\nArquivo: ${fileName}`)
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
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Gerar Relatório Atual
          </button>
        </div>
      </div>
      
      {/* Filtros de Data */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filtrar por período:</span>
          </div>
          
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="dateFilter"
                value="current"
                checked={dateFilter === 'current'}
                onChange={(e) => setDateFilter(e.target.value as 'current' | 'last' | 'custom')}
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
                onChange={(e) => setDateFilter(e.target.value as 'current' | 'last' | 'custom')}
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
                onChange={(e) => setDateFilter(e.target.value as 'current' | 'last' | 'custom')}
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receita Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clientes Ativos
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total de Vidas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relatório
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nota Fiscal
                    </th>
                    {currentUser?.role === 'partner' && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enviar NFe
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dateFilter === 'current' || dateFilter === 'last' || dateFilter === 'custom' ? filteredReports : reports).map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.month} {report.year}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(report.totalRevenue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.totalClients}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.totalLives.toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          // Verificar se existe relatório disponível para este período
                          const availableReport = partnerReports.find(partnerReport => {
                            return partnerReport.referenceMonth === (new Date().getMonth() - (12 - report.id)) + 1 && 
                                   partnerReport.referenceYear === report.year &&
                                   partnerReport.status === 'available'
                          })
                          
                          return availableReport ? (
                            <button
                              onClick={() => handleDownloadReport(report.id, report.month, report.year)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                              Baixar
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500">
                              Não disponível
                            </span>
                          )
                        })()} 
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.reportGenerated ? (
                          report.invoiceSent ? (
                            <span className="inline-flex items-center px-3 py-2 text-sm text-green-700 bg-green-100 rounded-md">
                              ✓ Enviada
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendInvoice(report.id, report.month, report.year)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                              Enviar
                            </button>
                          )
                        ) : (
                          <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500">
                            Aguardando relatório
                          </span>
                        )}
                      </td>
                      {currentUser?.role === 'partner' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.nfeUploaded ? (
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
                                onChange={(e) => handleNfeUpload(e, report.id, report.month, report.year)}
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
      
      {(dateFilter === 'current' || dateFilter === 'last' || dateFilter === 'custom' ? filteredReports : reports).length === 0 && (
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
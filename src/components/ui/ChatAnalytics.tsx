import React, { useState, useEffect } from 'react'
import { getMetricsSummary, getAllMetrics, exportMetricsToCSV, type MetricsSummary } from '../../services/chatMetricsService'

const ChatAnalytics: React.FC = () => {
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const data = await getMetricsSummary(dateRange.start, dateRange.end)
      setSummary(data)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const metrics = await getAllMetrics()
      const csv = exportMetricsToCSV(metrics)

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `chat-metrics-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      alert('Erro ao exportar dados')
    }
  }

  const handleFilterApply = () => {
    loadMetrics()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nenhuma métrica disponível ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">📊 Análise do ChatBot</h2>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            📥 Exportar CSV
          </button>
        </div>

        {/* Filtros de Data */}
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleFilterApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aplicar Filtro
          </button>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => {
                setDateRange({ start: '', end: '' })
                setTimeout(loadMetrics, 100)
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Interações</p>
              <p className="text-3xl font-bold text-gray-800">{summary.totalInteractions.toLocaleString('pt-BR')}</p>
            </div>
            <div className="text-4xl">💬</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sessões Únicas</p>
              <p className="text-3xl font-bold text-gray-800">{summary.totalSessions.toLocaleString('pt-BR')}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taxa de Utilidade</p>
              <p className="text-3xl font-bold text-green-600">{summary.helpfulnessRate.toFixed(1)}%</p>
            </div>
            <div className="text-4xl">👍</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Uso de IA</p>
              <p className="text-3xl font-bold text-purple-600">{summary.aiUsageRate.toFixed(1)}%</p>
            </div>
            <div className="text-4xl">🤖</div>
          </div>
        </div>
      </div>

      {/* Estatísticas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">Msgs por Sessão</p>
          <p className="text-2xl font-bold text-gray-800">{summary.averageMessagesPerSession.toFixed(1)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">Tokens Usados (IA)</p>
          <p className="text-2xl font-bold text-gray-800">{summary.totalTokensUsed.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">Tempo Médio Resposta</p>
          <p className="text-2xl font-bold text-gray-800">{summary.averageResponseTime.toFixed(0)}ms</p>
        </div>
      </div>

      {/* Fluxos Mais Comuns */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🔄 Fluxos Mais Acessados</h3>
        <div className="space-y-3">
          {summary.mostCommonFlows.length > 0 ? (
            summary.mostCommonFlows.map((flow, index) => {
              const percentage = (flow.count / summary.totalInteractions) * 100
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{flow.flow.replace('_', ' ')}</span>
                      <span className="text-sm text-gray-600">{flow.count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhum fluxo registrado ainda</p>
          )}
        </div>
      </div>

      {/* Opções Mais Clicadas */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Opções Mais Clicadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.mostClickedOptions.length > 0 ? (
            summary.mostClickedOptions.map((option, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{option.option}</span>
                <span className="text-sm font-bold text-blue-600">{option.count}x</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4 col-span-2">Nenhuma opção clicada ainda</p>
          )}
        </div>
      </div>

      {/* Taxa de Conclusão por Fluxo */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">✅ Taxa de Conclusão por Fluxo</h3>
        <div className="space-y-3">
          {summary.flowCompletionRate.length > 0 ? (
            summary.flowCompletionRate.map((flow, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{flow.flow.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-600">{flow.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        flow.completionRate >= 70 ? 'bg-green-600' :
                        flow.completionRate >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${flow.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhum dado de conclusão disponível</p>
          )}
        </div>
      </div>

      {/* Top Usuários */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Usuários Mais Ativos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.topUsers.length > 0 ? (
                summary.topUsers.map((user, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">{user.interactions}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Nenhum usuário ativo ainda</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de Interações por Dia (últimos 30 dias) */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Interações por Dia (Últimos 30 dias)</h3>
        <div className="space-y-2">
          {summary.interactionsByDay.length > 0 ? (
            summary.interactionsByDay.map((day, index) => {
              const maxCount = Math.max(...summary.interactionsByDay.map(d => d.count))
              const percentage = (day.count / maxCount) * 100

              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-24">{new Date(day.date).toLocaleDateString('pt-BR')}</span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-6 flex items-center">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%`, minWidth: day.count > 0 ? '30px' : '0' }}
                      >
                        {day.count > 0 && (
                          <span className="text-xs font-semibold text-white">{day.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma interação registrada ainda</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatAnalytics

/**
 * Serviço de métricas do ChatBot
 * Registra interações e gera análises para o dashboard administrativo
 */

import { API_URL } from '../config/api'

export interface ChatMetric {
  id: string
  userId: string
  userName: string
  userRole: string
  timestamp: string
  sessionId: string
  messageType: 'user' | 'bot'
  message: string
  flow: string
  selectedOption?: string
  wasHelpful?: boolean
  aiGenerated?: boolean
  tokensUsed?: number
  responseTime?: number // em ms
}

export interface MetricsSummary {
  totalInteractions: number
  totalSessions: number
  averageMessagesPerSession: number
  mostCommonFlows: Array<{ flow: string; count: number }>
  mostClickedOptions: Array<{ option: string; count: number }>
  helpfulnessRate: number
  aiUsageRate: number
  totalTokensUsed: number
  averageResponseTime: number
  topUsers: Array<{ userName: string; interactions: number }>
  interactionsByDay: Array<{ date: string; count: number }>
  flowCompletionRate: Array<{ flow: string; completionRate: number }>
}

/**
 * Registra uma interação do chat
 */
export async function logChatMetric(metric: Omit<ChatMetric, 'id'>): Promise<void> {
  try {
    const metricWithId: ChatMetric = {
      ...metric,
      id: Date.now().toString()
    }

    await fetch(`${API_URL}/chat_metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metricWithId)
    })
  } catch (error) {
    console.error('Erro ao registrar métrica:', error)
    // Não bloqueia o chat em caso de erro
  }
}

/**
 * Busca todas as métricas
 */
export async function getAllMetrics(): Promise<ChatMetric[]> {
  try {
    const response = await fetch(`${API_URL}/chat_metrics`)
    if (!response.ok) throw new Error('Erro ao buscar métricas')
    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar métricas:', error)
    return []
  }
}

/**
 * Gera resumo de métricas para o dashboard
 */
export async function getMetricsSummary(startDate?: string, endDate?: string): Promise<MetricsSummary> {
  const metrics = await getAllMetrics()

  // Filtrar por data se fornecido
  let filteredMetrics = metrics
  if (startDate || endDate) {
    filteredMetrics = metrics.filter(m => {
      const metricDate = new Date(m.timestamp)
      if (startDate && metricDate < new Date(startDate)) return false
      if (endDate && metricDate > new Date(endDate)) return false
      return true
    })
  }

  // Total de interações
  const totalInteractions = filteredMetrics.length

  // Total de sessões únicas
  const uniqueSessions = new Set(filteredMetrics.map(m => m.sessionId))
  const totalSessions = uniqueSessions.size

  // Média de mensagens por sessão
  const averageMessagesPerSession = totalSessions > 0 ? totalInteractions / totalSessions : 0

  // Fluxos mais comuns
  const flowCounts: Record<string, number> = {}
  filteredMetrics.forEach(m => {
    if (m.flow && m.flow !== 'initial') {
      flowCounts[m.flow] = (flowCounts[m.flow] || 0) + 1
    }
  })
  const mostCommonFlows = Object.entries(flowCounts)
    .map(([flow, count]) => ({ flow, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Opções mais clicadas
  const optionCounts: Record<string, number> = {}
  filteredMetrics.forEach(m => {
    if (m.selectedOption) {
      optionCounts[m.selectedOption] = (optionCounts[m.selectedOption] || 0) + 1
    }
  })
  const mostClickedOptions = Object.entries(optionCounts)
    .map(([option, count]) => ({ option, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Taxa de utilidade (helpful)
  const helpfulVotes = filteredMetrics.filter(m => m.wasHelpful !== undefined)
  const helpfulCount = helpfulVotes.filter(m => m.wasHelpful).length
  const helpfulnessRate = helpfulVotes.length > 0 ? (helpfulCount / helpfulVotes.length) * 100 : 0

  // Taxa de uso de IA
  const aiGeneratedMessages = filteredMetrics.filter(m => m.aiGenerated).length
  const aiUsageRate = totalInteractions > 0 ? (aiGeneratedMessages / totalInteractions) * 100 : 0

  // Total de tokens usados
  const totalTokensUsed = filteredMetrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0)

  // Tempo médio de resposta
  const responseTimes = filteredMetrics.filter(m => m.responseTime).map(m => m.responseTime!)
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0

  // Usuários mais ativos
  const userCounts: Record<string, { userName: string; count: number }> = {}
  filteredMetrics.forEach(m => {
    if (!userCounts[m.userId]) {
      userCounts[m.userId] = { userName: m.userName, count: 0 }
    }
    userCounts[m.userId].count++
  })
  const topUsers = Object.values(userCounts)
    .map(u => ({ userName: u.userName, interactions: u.count }))
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 10)

  // Interações por dia (últimos 30 dias)
  const daysCounts: Record<string, number> = {}
  filteredMetrics.forEach(m => {
    const date = new Date(m.timestamp).toISOString().split('T')[0]
    daysCounts[date] = (daysCounts[date] || 0) + 1
  })
  const interactionsByDay = Object.entries(daysCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  // Taxa de conclusão por fluxo
  const sessionsByFlow: Record<string, Set<string>> = {}
  const completedSessions: Record<string, Set<string>> = {}

  filteredMetrics.forEach(m => {
    if (!m.flow || m.flow === 'initial') return

    if (!sessionsByFlow[m.flow]) {
      sessionsByFlow[m.flow] = new Set()
      completedSessions[m.flow] = new Set()
    }

    sessionsByFlow[m.flow].add(m.sessionId)

    // Considera completo se usuário votou em "helpful" ou selecionou "Voltar"
    if (m.wasHelpful !== undefined || m.selectedOption === 'Voltar') {
      completedSessions[m.flow].add(m.sessionId)
    }
  })

  const flowCompletionRate = Object.entries(sessionsByFlow).map(([flow, sessions]) => {
    const total = sessions.size
    const completed = completedSessions[flow]?.size || 0
    return {
      flow,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    }
  })

  return {
    totalInteractions,
    totalSessions,
    averageMessagesPerSession,
    mostCommonFlows,
    mostClickedOptions,
    helpfulnessRate,
    aiUsageRate,
    totalTokensUsed,
    averageResponseTime,
    topUsers,
    interactionsByDay,
    flowCompletionRate
  }
}

/**
 * Exporta métricas para CSV
 */
export function exportMetricsToCSV(metrics: ChatMetric[]): string {
  const headers = [
    'ID',
    'Data/Hora',
    'Usuário',
    'Função',
    'Sessão',
    'Tipo',
    'Mensagem',
    'Fluxo',
    'Opção Selecionada',
    'Foi Útil?',
    'IA Gerada?',
    'Tokens Usados',
    'Tempo de Resposta (ms)'
  ]

  const rows = metrics.map(m => [
    m.id,
    new Date(m.timestamp).toLocaleString('pt-BR'),
    m.userName,
    m.userRole,
    m.sessionId,
    m.messageType,
    `"${m.message.replace(/"/g, '""')}"`,
    m.flow,
    m.selectedOption || '',
    m.wasHelpful === true ? 'Sim' : m.wasHelpful === false ? 'Não' : '',
    m.aiGenerated ? 'Sim' : 'Não',
    m.tokensUsed || 0,
    m.responseTime || 0
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

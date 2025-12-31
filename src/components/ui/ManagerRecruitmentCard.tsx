import { useState, useEffect } from 'react'
import {
  LinkIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { getCurrentUser } from '../../services/auth'
import { API_URL } from '../../config/api'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'

interface PartnerProspect {
  id: string
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function ManagerRecruitmentCard() {
  const [user, setUser] = useState<any>(null)
  const [prospects, setProspects] = useState<PartnerProspect[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserAndProspects()
  }, [])

  const loadUserAndProspects = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      // Buscar prospects indicados pelo gerente
      const response = await fetchWithAuth(`${API_URL}/partner_prospects`)
      if (response.ok) {
        const data = await response.json()
        setProspects(data)
      }
    } catch (error) {
      console.error('Error loading manager data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLandingPageUrl = () => {
    if (!user?.manager_slug) return ''
    const baseUrl = window.location.origin + window.location.pathname
    return `${baseUrl}#gerente/${user.manager_slug}`
  }

  const copyToClipboard = async () => {
    const url = getLandingPageUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const shareUrl = async () => {
    const url = getLandingPageUrl()
    const text = `Seja um parceiro da nossa equipe! Acesse: ${url}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite para ser Parceiro',
          text: text,
          url: url
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      copyToClipboard()
    }
  }

  const stats = {
    total: prospects.length,
    pending: prospects.filter(p => p.status === 'pending').length,
    approved: prospects.filter(p => p.status === 'approved').length,
    rejected: prospects.filter(p => p.status === 'rejected').length
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!user?.manager_slug) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-600 rounded-lg">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recrute Novos Parceiros
            </h3>
            <p className="text-sm text-gray-600">
              Compartilhe sua landing page personalizada
            </p>
          </div>
        </div>
      </div>

      {/* URL Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sua Landing Page de Recrutamento
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-700 overflow-x-auto">
            <code>{getLandingPageUrl()}</code>
          </div>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? (
              <>
                <ClipboardDocumentCheckIcon className="h-5 w-5" />
              </>
            ) : (
              <>
                <LinkIcon className="h-5 w-5" />
              </>
            )}
          </button>
          <button
            onClick={shareUrl}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>
        {copied && (
          <p className="mt-2 text-sm text-green-600 font-medium">
            Link copiado para a área de transferência!
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprovados</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejeitados</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Recent Prospects */}
      {prospects.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Candidatos Recentes
          </h4>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {prospects.slice(0, 3).map((prospect) => (
                <div key={prospect.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {prospect.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {prospect.email}
                      </p>
                    </div>
                    <div className="ml-4">
                      {prospect.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Pendente
                        </span>
                      )}
                      {prospect.status === 'approved' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Aprovado
                        </span>
                      )}
                      {prospect.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Rejeitado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {prospects.length > 3 && (
            <p className="mt-2 text-center text-sm text-gray-500">
              e mais {prospects.length - 3} candidatos...
            </p>
          )}
        </div>
      )}

      {prospects.length === 0 && (
        <div className="bg-white rounded-lg p-6 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum candidato ainda
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Compartilhe sua landing page e comece a recrutar novos parceiros para sua equipe!
          </p>
        </div>
      )}
    </div>
  )
}

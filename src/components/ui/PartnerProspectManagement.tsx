import { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { API_URL } from '../../config/api'
import { fetchWithAuth } from '../../services/api/fetch-with-auth'
import { getCurrentUser } from '../../services/auth'

interface PartnerProspect {
  id: string
  name: string
  email: string
  phone: string
  company: string
  cnpj: string
  referredByPartnerId: string
  referredByPartnerName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  approvedAt?: string
  approvedBy?: string
  approvalNotes?: string
}

export default function PartnerProspectManagement() {
  const [prospects, setProspects] = useState<PartnerProspect[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedProspect, setSelectedProspect] = useState<PartnerProspect | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [approving, setApproving] = useState(false)
  const [notes, setNotes] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchProspects()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const fetchProspects = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/partner_prospects`)

      if (response.ok) {
        const data = await response.json()
        setProspects(data)
      }
    } catch (error) {
      console.error('Error fetching partner prospects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (prospect: PartnerProspect, isApproved: boolean) => {
    setApproving(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/partner_prospects/${prospect.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isApproved,
          approvalNotes: notes
        })
      })

      if (response.ok) {
        await fetchProspects()
        setShowModal(false)
        setSelectedProspect(null)
        setNotes('')
      }
    } catch (error) {
      console.error('Error approving prospect:', error)
    } finally {
      setApproving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente', icon: ClockIcon },
      approved: { color: 'bg-green-100 text-green-800', text: 'Aprovado', icon: CheckCircleIcon },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejeitado', icon: XCircleIcon }
    }

    const { color, text, icon: Icon } = config[status as keyof typeof config] || config.pending

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {text}
      </span>
    )
  }

  const filteredProspects = filter === 'all'
    ? prospects
    : prospects.filter(p => p.status === filter)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects de Parceiros</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie candidatos a parceiros indicados pela rede
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({prospects.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pendentes ({prospects.filter(p => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Aprovados ({prospects.filter(p => p.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rejeitados ({prospects.filter(p => p.status === 'rejected').length})
        </button>
      </div>

      {/* Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indicado por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProspects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          Nenhum prospect encontrado
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {filter === 'pending'
                            ? 'Não há prospects pendentes de aprovação.'
                            : `Não há prospects ${filter === 'all' ? '' : filter === 'approved' ? 'aprovados' : 'rejeitados'}.`
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProspects.map((prospect) => (
                      <tr key={prospect.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {prospect.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {prospect.email}
                            </div>
                            {prospect.phone && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <PhoneIcon className="h-4 w-4 mr-1" />
                                {prospect.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              {prospect.company || 'Não informado'}
                              {prospect.cnpj && (
                                <div className="text-xs text-gray-500">{prospect.cnpj}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prospect.referredByPartnerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(prospect.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(prospect.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {prospect.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedProspect(prospect)
                                  setShowModal(true)
                                }}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                              >
                                Avaliar
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {prospect.approvedBy && (
                                <div>Por: {prospect.approvedBy}</div>
                              )}
                              {prospect.approvedAt && (
                                <div className="text-xs">
                                  {new Date(prospect.approvedAt).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showModal && selectedProspect && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Avaliar Prospect de Parceiro
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informações do Candidato</h4>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nome</dt>
                      <dd className="text-sm text-gray-900">{selectedProspect.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{selectedProspect.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                      <dd className="text-sm text-gray-900">{selectedProspect.phone || 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                      <dd className="text-sm text-gray-900">{selectedProspect.company || 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CNPJ</dt>
                      <dd className="text-sm text-gray-900">{selectedProspect.cnpj || 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Indicado por</dt>
                      <dd className="text-sm text-gray-900">{selectedProspect.referredByPartnerName}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Adicione observações sobre esta aprovação/rejeição..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedProspect(null)
                    setNotes('')
                  }}
                  disabled={approving}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleApprove(selectedProspect, false)}
                  disabled={approving}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  {approving ? 'Processando...' : 'Rejeitar'}
                </button>
                <button
                  onClick={() => handleApprove(selectedProspect, true)}
                  disabled={approving}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {approving ? 'Processando...' : 'Aprovar e Criar Parceiro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

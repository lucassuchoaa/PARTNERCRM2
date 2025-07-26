import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import HubSpotService from '../../services/hubspot'
import type { HubSpotContact, HubSpotCompany, HubSpotDeal } from '../../services/hubspot'

interface HubSpotIntegrationProps {
  prospectData: {
    email: string
    companyName: string
    contactName: string
    phone?: string
  }
  onValidationComplete?: (result: ValidationResult) => void
}

interface ValidationResult {
  contact: HubSpotContact | null
  company: HubSpotCompany | null
  deals: HubSpotDeal[]
  status: 'new' | 'existing' | 'customer'
  validation: {
    emailExists: boolean
    companyExists: boolean
    hasActiveDeals: boolean
    isCustomer: boolean
  }
}

const HubSpotIntegration: React.FC<HubSpotIntegrationProps> = ({ prospectData, onValidationComplete }) => {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hubspotService, setHubspotService] = useState<HubSpotService | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  // Verificar se o HubSpot está configurado
  useEffect(() => {
    const accessToken = import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN
    if (accessToken) {
      const service = new HubSpotService({ accessToken })
      setHubspotService(service)
      setIsConfigured(true)
    } else {
      setError('Token de acesso do HubSpot não configurado')
    }
  }, [])

  const validateProspect = async () => {
    if (!hubspotService) {
      setError('Serviço HubSpot não configurado')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const result = await hubspotService.validateProspectData(prospectData)
      setValidationResult(result)
      onValidationComplete?.(result)
    } catch (err: any) {
      setError(err.message || 'Erro ao validar dados no HubSpot')
    } finally {
      setIsValidating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'existing':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'customer':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Novo Prospect'
      case 'existing':
        return 'Prospect Existente'
      case 'customer':
        return 'Cliente Existente'
      default:
        return 'Desconhecido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-800'
      case 'existing':
        return 'bg-yellow-100 text-yellow-800'
      case 'customer':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
          <p className="text-sm text-yellow-700">
            Integração com HubSpot não configurada. Configure a variável VITE_HUBSPOT_ACCESS_TOKEN.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900">Validação HubSpot</h4>
        <button
          onClick={validateProspect}
          disabled={isValidating}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Validar no HubSpot
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {validationResult && (
        <div className="space-y-4">
          {/* Status Geral */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getStatusIcon(validationResult.status)}
              <span className="ml-2 font-medium text-gray-900">
                {getStatusText(validationResult.status)}
              </span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(validationResult.status)}`}>
              {validationResult.status.toUpperCase()}
            </span>
          </div>

          {/* Detalhes da Validação */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Validações</h5>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  {validationResult.validation.emailExists ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className={validationResult.validation.emailExists ? 'text-green-700' : 'text-gray-600'}>
                    Email existe no HubSpot
                  </span>
                </div>
                <div className="flex items-center">
                  {validationResult.validation.companyExists ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className={validationResult.validation.companyExists ? 'text-green-700' : 'text-gray-600'}>
                    Empresa existe no HubSpot
                  </span>
                </div>
                <div className="flex items-center">
                  {validationResult.validation.hasActiveDeals ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className={validationResult.validation.hasActiveDeals ? 'text-green-700' : 'text-gray-600'}>
                    Possui deals ativos
                  </span>
                </div>
                <div className="flex items-center">
                  {validationResult.validation.isCustomer ? (
                    <CheckCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className={validationResult.validation.isCustomer ? 'text-red-700' : 'text-gray-600'}>
                    É cliente existente
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Informações</h5>
              <div className="text-sm text-gray-600 space-y-1">
                {validationResult.contact && (
                  <div>
                    <strong>Contato:</strong> {validationResult.contact.properties.firstname} {validationResult.contact.properties.lastname}
                  </div>
                )}
                {validationResult.company && (
                  <div>
                    <strong>Empresa:</strong> {validationResult.company.properties.name}
                  </div>
                )}
                {validationResult.deals.length > 0 && (
                  <div>
                    <strong>Deals:</strong> {validationResult.deals.length} encontrado(s)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deals Detalhados */}
          {validationResult.deals.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2">Deals Associados</h5>
              <div className="space-y-2">
                {validationResult.deals.map((deal, index) => (
                  <div key={deal.id} className="p-2 bg-gray-50 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{deal.properties.dealname || 'Deal sem nome'}</p>
                        <p className="text-xs text-gray-600">
                          Valor: {deal.properties.amount ? `R$ ${deal.properties.amount}` : 'Não informado'}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {deal.properties.dealstage || 'Estágio não definido'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HubSpotIntegration
export type { ValidationResult }
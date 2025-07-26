import React, { useState } from 'react'
import HubSpotIntegration from '../ui/HubSpotIntegration'
import type { ValidationResult } from '../ui/HubSpotIntegration'

const HubSpotExample: React.FC = () => {
  const [prospectData, setProspectData] = useState({
    email: '',
    companyName: '',
    contactName: '',
    phone: ''
  })
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setProspectData(prev => ({ ...prev, [field]: value }))
  }

  const handleValidationComplete = (result: ValidationResult) => {
    setValidationResult(result)
    console.log('Resultado da validação HubSpot:', result)
  }

  const isFormValid = prospectData.email && prospectData.companyName && prospectData.contactName

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Exemplo de Integração HubSpot</h2>
          <p className="mt-1 text-sm text-gray-600">
            Demonstração da validação de prospects usando a API do HubSpot
          </p>
        </div>

        <div className="p-6">
          {/* Formulário de Dados do Prospect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email do Contato *
              </label>
              <input
                type="email"
                id="email"
                value={prospectData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="exemplo@empresa.com"
              />
            </div>

            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Contato *
              </label>
              <input
                type="text"
                id="contactName"
                value={prospectData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="João Silva"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                id="companyName"
                value={prospectData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Empresa Exemplo Ltda"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                value={prospectData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Componente de Integração HubSpot */}
          {isFormValid && (
            <HubSpotIntegration
              prospectData={prospectData}
              onValidationComplete={handleValidationComplete}
            />
          )}

          {!isFormValid && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Preencha os campos obrigatórios (*) para habilitar a validação no HubSpot.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resultado da Validação */}
      {validationResult && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Resultado da Validação</h3>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(validationResult, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Instruções de Configuração */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Configuração da Integração</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>1.</strong> Obtenha um token de acesso do HubSpot:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Acesse as configurações da sua conta HubSpot</li>
            <li>Vá para "Integrações" → "Chaves de API"</li>
            <li>Crie uma nova chave de API privada</li>
          </ul>
          <p><strong>2.</strong> Configure a variável de ambiente:</p>
          <code className="block bg-blue-100 p-2 rounded mt-1">
            REACT_APP_HUBSPOT_ACCESS_TOKEN=seu_token_aqui
          </code>
          <p><strong>3.</strong> Reinicie a aplicação para aplicar as configurações</p>
        </div>
      </div>
    </div>
  )
}

export default HubSpotExample
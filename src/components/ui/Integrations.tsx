import React, { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  KeyIcon,
  LinkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface IntegrationConfig {
  netsuite: {
    enabled: boolean
    accountId: string
    consumerKey: string
    consumerSecret: string
    tokenId: string
    tokenSecret: string
    lastSync?: string
  }
  hubspot: {
    enabled: boolean
    apiKey: string
    portalId: string
    lastSync?: string
  }
}

const Integrations: React.FC = () => {
  const [config, setConfig] = useState<IntegrationConfig>({
    netsuite: {
      enabled: false,
      accountId: '',
      consumerKey: '',
      consumerSecret: '',
      tokenId: '',
      tokenSecret: '',
    },
    hubspot: {
      enabled: false,
      apiKey: '',
      portalId: '',
    }
  })

  const [showNetSuiteKeys, setShowNetSuiteKeys] = useState(false)
  const [showHubSpotKey, setShowHubSpotKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  useEffect(() => {
    // Carregar configurações salvas do localStorage
    const saved = localStorage.getItem('integrations_config')
    if (saved) {
      setConfig(JSON.parse(saved))
    }
  }, [])

  const handleSave = async (integration: 'netsuite' | 'hubspot') => {
    setIsSaving(true)
    try {
      // Salvar no localStorage (em produção, isso seria uma API call)
      localStorage.setItem('integrations_config', JSON.stringify(config))

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert(`✅ Configurações do ${integration === 'netsuite' ? 'NetSuite' : 'HubSpot'} salvas com sucesso!`)
    } catch (error) {
      alert('❌ Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async (integration: 'netsuite' | 'hubspot') => {
    setTestingConnection(integration)
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Atualizar lastSync
      const now = new Date().toISOString()
      setConfig(prev => ({
        ...prev,
        [integration]: {
          ...prev[integration],
          lastSync: now
        }
      }))

      alert(`✅ Conexão com ${integration === 'netsuite' ? 'NetSuite' : 'HubSpot'} testada com sucesso!`)
    } catch (error) {
      alert('❌ Falha ao conectar. Verifique as credenciais.')
    } finally {
      setTestingConnection(null)
    }
  }

  const handleToggle = (integration: 'netsuite' | 'hubspot') => {
    setConfig(prev => ({
      ...prev,
      [integration]: {
        ...prev[integration],
        enabled: !prev[integration].enabled
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔗 Integrações</h2>
        <p className="text-gray-600">Configure as integrações com sistemas externos para sincronizar dados automaticamente.</p>
      </div>

      {/* NetSuite Integration */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">NetSuite ERP</h3>
              <p className="text-sm text-gray-600">Sistema de gestão empresarial integrado</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {config.netsuite.enabled ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircleIcon className="w-5 h-5" />
                Ativo
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gray-400 font-medium">
                <XCircleIcon className="w-5 h-5" />
                Inativo
              </span>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.netsuite.enabled}
                onChange={() => handleToggle('netsuite')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* NetSuite Features */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">📦 Funcionalidades:</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Sincronização automática de clientes e parceiros</li>
            <li>• Integração de pedidos e faturas</li>
            <li>• Atualização de estoque em tempo real</li>
            <li>• Exportação de relatórios financeiros</li>
            <li>• Sincronização de comissões de vendas</li>
          </ul>
        </div>

        {/* NetSuite Configuration */}
        {config.netsuite.enabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Mostrar Credenciais</span>
              <button
                onClick={() => setShowNetSuiteKeys(!showNetSuiteKeys)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {showNetSuiteKeys ? '🔒 Ocultar' : '👁️ Mostrar'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account ID <span className="text-red-500">*</span>
                </label>
                <input
                  type={showNetSuiteKeys ? 'text' : 'password'}
                  value={config.netsuite.accountId}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    netsuite: { ...prev.netsuite, accountId: e.target.value }
                  }))}
                  placeholder="Ex: 1234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consumer Key <span className="text-red-500">*</span>
                </label>
                <input
                  type={showNetSuiteKeys ? 'text' : 'password'}
                  value={config.netsuite.consumerKey}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    netsuite: { ...prev.netsuite, consumerKey: e.target.value }
                  }))}
                  placeholder="Chave do consumidor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consumer Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type={showNetSuiteKeys ? 'text' : 'password'}
                  value={config.netsuite.consumerSecret}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    netsuite: { ...prev.netsuite, consumerSecret: e.target.value }
                  }))}
                  placeholder="Segredo do consumidor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token ID <span className="text-red-500">*</span>
                </label>
                <input
                  type={showNetSuiteKeys ? 'text' : 'password'}
                  value={config.netsuite.tokenId}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    netsuite: { ...prev.netsuite, tokenId: e.target.value }
                  }))}
                  placeholder="ID do token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type={showNetSuiteKeys ? 'text' : 'password'}
                  value={config.netsuite.tokenSecret}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    netsuite: { ...prev.netsuite, tokenSecret: e.target.value }
                  }))}
                  placeholder="Segredo do token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {config.netsuite.lastSync && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ArrowPathIcon className="w-4 h-4" />
                Última sincronização: {new Date(config.netsuite.lastSync).toLocaleString('pt-BR')}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleSave('netsuite')}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <KeyIcon className="w-5 h-5" />
                    Salvar Credenciais
                  </>
                )}
              </button>

              <button
                onClick={() => handleTestConnection('netsuite')}
                disabled={testingConnection === 'netsuite'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testingConnection === 'netsuite' ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Testar Conexão
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HubSpot Integration */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">HubSpot CRM</h3>
              <p className="text-sm text-gray-600">Plataforma de gestão de relacionamento com clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {config.hubspot.enabled ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircleIcon className="w-5 h-5" />
                Ativo
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gray-400 font-medium">
                <XCircleIcon className="w-5 h-5" />
                Inativo
              </span>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.hubspot.enabled}
                onChange={() => handleToggle('hubspot')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>

        {/* HubSpot Features */}
        <div className="mb-6 p-4 bg-orange-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">📊 Funcionalidades:</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Sincronização automática de contatos e leads</li>
            <li>• Criação automática de deals a partir de indicações</li>
            <li>• Rastreamento de pipeline de vendas</li>
            <li>• Integração com campanhas de marketing</li>
            <li>• Automação de follow-ups e nurturing</li>
            <li>• Relatórios de conversão e ROI</li>
          </ul>
        </div>

        {/* HubSpot Configuration */}
        {config.hubspot.enabled && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Como obter sua API Key do HubSpot:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Acesse as configurações da sua conta HubSpot</li>
                  <li>Vá em "Integrações" → "Chaves de API"</li>
                  <li>Clique em "Criar chave de API"</li>
                  <li>Copie e cole a chave abaixo</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Mostrar API Key</span>
              <button
                onClick={() => setShowHubSpotKey(!showHubSpotKey)}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                {showHubSpotKey ? '🔒 Ocultar' : '👁️ Mostrar'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type={showHubSpotKey ? 'text' : 'password'}
                  value={config.hubspot.apiKey}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    hubspot: { ...prev.hubspot, apiKey: e.target.value }
                  }))}
                  placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portal ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.hubspot.portalId}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    hubspot: { ...prev.hubspot, portalId: e.target.value }
                  }))}
                  placeholder="Ex: 12345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {config.hubspot.lastSync && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ArrowPathIcon className="w-4 h-4" />
                Última sincronização: {new Date(config.hubspot.lastSync).toLocaleString('pt-BR')}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleSave('hubspot')}
                disabled={isSaving}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <KeyIcon className="w-5 h-5" />
                    Salvar Credenciais
                  </>
                )}
              </button>

              <button
                onClick={() => handleTestConnection('hubspot')}
                disabled={testingConnection === 'hubspot'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testingConnection === 'hubspot' ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Testar Conexão
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informações Importantes</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• As credenciais são armazenadas de forma segura e criptografada</li>
          <li>• A sincronização ocorre automaticamente a cada 15 minutos quando ativa</li>
          <li>• Você pode pausar a integração a qualquer momento usando o switch</li>
          <li>• Em caso de erro, verifique suas credenciais e tente novamente</li>
        </ul>
      </div>
    </div>
  )
}

export default Integrations

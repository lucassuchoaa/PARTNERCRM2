import { useState } from 'react'
import { API_URL } from '../config/api'
import { fetchWithAuth } from '../services/api/fetch-with-auth'

export default function DiagnosticoRoles() {
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testarAPI = async () => {
    setLoading(true)
    setResultado(null)

    try {
      console.log('='.repeat(50))
      console.log('DIAGNÓSTICO DE ROLES')
      console.log('='.repeat(50))
      console.log('API_URL configurado:', API_URL)
      console.log('URL completa:', `${API_URL}/roles`)

      const user = localStorage.getItem('user')
      const token = localStorage.getItem('accessToken')
      const authTokens = localStorage.getItem('auth_tokens')

      console.log('Usuário logado:', user ? 'Sim' : 'Não')
      console.log('Token disponível:', token ? 'Sim' : 'Não')
      console.log('Auth tokens:', authTokens ? 'Sim' : 'Não')

      const response = await fetchWithAuth(`${API_URL}/roles`)
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('Dados recebidos:', data)

      setResultado({
        success: true,
        apiUrl: API_URL,
        fullUrl: `${API_URL}/roles`,
        responseStatus: response.status,
        data: data,
        numRoles: data.success ? data.data?.length : 0,
        user: user ? JSON.parse(user) : null,
        hasToken: !!token || !!authTokens
      })

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error)
      setResultado({
        success: false,
        error: error.message,
        stack: error.stack
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Roles</h1>

      <div className="mb-6">
        <button
          onClick={testarAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Testando...' : 'Testar API de Roles'}
        </button>
      </div>

      {resultado && (
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto">
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-bold mb-2">Informações do Sistema</h3>
        <ul className="text-sm space-y-1">
          <li><strong>API_URL configurado:</strong> {API_URL}</li>
          <li><strong>Ambiente:</strong> {import.meta.env.MODE}</li>
          <li><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'não definido'}</li>
          <li><strong>Window location:</strong> {window.location.href}</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-bold mb-2">Como usar:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Faça login primeiro se ainda não estiver logado</li>
          <li>Clique em "Testar API de Roles"</li>
          <li>Verifique os logs no console (F12)</li>
          <li>Veja o resultado detalhado abaixo</li>
        </ol>
      </div>
    </div>
  )
}

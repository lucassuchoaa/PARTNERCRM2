/**
 * Wrapper para fetch() que adiciona automaticamente o Authorization header
 * com o JWT token do localStorage
 */

/**
 * Buscar tokens do localStorage (compatível com ambos formatos)
 */
function getAccessToken(): string | null {
  // Primeiro tenta o formato consolidado
  const tokensJson = localStorage.getItem('auth_tokens')
  if (tokensJson) {
    try {
      const tokens = JSON.parse(tokensJson)
      return tokens.accessToken || null
    } catch {
      // Ignora erros de parse
    }
  }

  // Fallback para o formato antigo
  const token = localStorage.getItem('accessToken')
  if (!token) {
    console.error('[fetchWithAuth] Token não encontrado no localStorage')
  }
  return token
}

/**
 * Faz uma requisição HTTP com autenticação automática
 * Adiciona o token JWT ao header Authorization se disponível
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Buscar token usando a função helper
  const accessToken = getAccessToken()
  
  // Adicionar Authorization header se token existe
  const headers = new Headers(options.headers || {})
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  
  // Fazer requisição com headers atualizados e credentials para enviar cookies
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
}

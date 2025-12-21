import { API_URL } from '../config/api'
import type { User } from '../types'

interface LoginCredentials {
  email: string
  password: string
}

export async function login({ email, password }: LoginCredentials): Promise<User> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error || `Erro ao fazer login: ${response.status}`)
    }

    const data = await response.json()

    // O backend retorna { success: true, user: {...}, tokens: {...} }
    if (data.success && data.user && data.tokens) {
      // Armazenar tokens
      if (data.tokens.accessToken) {
        localStorage.setItem('accessToken', data.tokens.accessToken)
      }
      if (data.tokens.refreshToken) {
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
      }

      // Armazenar usuário
      const user = data.user
      localStorage.setItem('user', JSON.stringify(user))

      return user
    }

    throw new Error('Resposta inválida do servidor')
  } catch (error: any) {
    console.error('Erro no login:', error)
    throw new Error(error.message || 'Erro ao fazer login. Tente novamente.')
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const userJson = localStorage.getItem('user')
    if (!userJson) return null

    const user = JSON.parse(userJson)

    // Validar campos mínimos
    if (!user.id || !user.email || !user.role) {
      console.warn('Dados de usuário incompletos, limpando localStorage')
      logout()
      return null
    }

    return user
  } catch (error) {
    console.error('Erro ao parsear usuário do localStorage:', error)
    logout()
    return null
  }
}

export function setCurrentUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user))
}

export function logout(): void {
  localStorage.removeItem('user')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}
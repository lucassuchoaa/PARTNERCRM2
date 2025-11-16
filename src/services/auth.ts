interface User {
  id: number
  email: string
  name: string
  role: string
}

interface LoginCredentials {
  email: string
  password: string
}

import { API_URL } from '../config/api'

export async function login({ email, password }: LoginCredentials): Promise<User> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error || `Erro ao fazer login: ${response.status}`)
    }

    const data = await response.json()

    // O backend retorna { success: true, data: { user, accessToken, refreshToken } }
    if (data.success && data.data) {
      // Armazenar tokens
      if (data.data.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken)
      }
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken)
      }

      // Armazenar usuário
      const user = data.data.user
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
  const userJson = localStorage.getItem('user')
  if (!userJson) return null

  return JSON.parse(userJson)
}

export function setCurrentUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user))
}

export function logout(): void {
  localStorage.removeItem('user')
}
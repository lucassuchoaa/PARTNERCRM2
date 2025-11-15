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
    const response = await fetch(`${API_URL}/users?email=${email}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar usuário: ${response.status}`)
    }

    // Verificar se é realmente JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Servidor não retornou dados válidos')
    }

    const users = await response.json()

    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('Usuário não encontrado')
    }

    const user = users[0]
    if (user.password !== password) {
      throw new Error('Senha incorreta')
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
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
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

const API_URL = 'http://localhost:3001'

export async function login({ email, password }: LoginCredentials): Promise<User> {
  const response = await fetch(`${API_URL}/users?email=${email}`)
  const users = await response.json()

  if (users.length === 0) {
    throw new Error('Usuário não encontrado')
  }

  const user = users[0]
  if (user.password !== password) {
    throw new Error('Senha incorreta')
  }

  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
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
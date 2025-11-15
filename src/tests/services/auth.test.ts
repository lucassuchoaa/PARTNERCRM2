import { describe, it, expect, beforeEach, vi } from 'vitest'
import { login, getCurrentUser, setCurrentUser, logout } from '../../services/auth'

describe('Auth Service', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = vi.fn()
  })

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'partner',
        password: 'password123'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => key === 'content-type' ? 'application/json' : null
        },
        json: async () => [mockUser]
      })

      const result = await login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'partner'
      })
      expect(result).not.toHaveProperty('password')
    })

    it('deve lançar erro para senha incorreta', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'partner',
        password: 'password123'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => key === 'content-type' ? 'application/json' : null
        },
        json: async () => [mockUser]
      })

      await expect(
        login({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      ).rejects.toThrow('Senha incorreta')
    })

    it('deve lançar erro para usuário não encontrado', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => key === 'content-type' ? 'application/json' : null
        },
        json: async () => []
      })

      await expect(
        login({
          email: 'notfound@example.com',
          password: 'password123'
        })
      ).rejects.toThrow('Usuário não encontrado')
    })

    it('deve lançar erro quando resposta não é JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => key === 'content-type' ? 'text/html' : null
        }
      })

      await expect(
        login({
          email: 'test@example.com',
          password: 'password123'
        })
      ).rejects.toThrow('Servidor não retornou dados válidos')
    })

    it('deve lançar erro quando API retorna erro', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })

      await expect(
        login({
          email: 'test@example.com',
          password: 'password123'
        })
      ).rejects.toThrow()
    })
  })

  describe('getCurrentUser', () => {
    it('deve retornar usuário armazenado no localStorage', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'partner'
      }

      localStorage.setItem('user', JSON.stringify(mockUser))

      const result = await getCurrentUser()
      expect(result).toEqual(mockUser)
    })

    it('deve retornar null quando não há usuário', async () => {
      const result = await getCurrentUser()
      expect(result).toBeNull()
    })
  })

  describe('setCurrentUser', () => {
    it('deve salvar usuário no localStorage', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'partner'
      }

      setCurrentUser(mockUser)

      const stored = localStorage.getItem('user')
      expect(stored).toBe(JSON.stringify(mockUser))
    })
  })

  describe('logout', () => {
    it('deve remover usuário do localStorage', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'partner'
      }

      localStorage.setItem('user', JSON.stringify(mockUser))
      logout()

      expect(localStorage.getItem('user')).toBeNull()
    })
  })
})

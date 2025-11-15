import { describe, it, expect } from 'vitest'
import { API_URL } from '../../config/api'

describe('API Config', () => {
  it('deve ter URL da API definida', () => {
    expect(API_URL).toBeDefined()
    expect(typeof API_URL).toBe('string')
  })

  it('deve ter URL válida', () => {
    expect(API_URL).toMatch(/^https?:\/\//)
  })

  it('deve apontar para localhost em desenvolvimento', () => {
    expect(API_URL).toBe('http://localhost:3001')
  })
})

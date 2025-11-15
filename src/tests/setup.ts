import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup após cada teste
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

// Mock localStorage with real implementation
const localStorageData: Record<string, string> = {}

const localStorageMock = {
  getItem: (key: string) => localStorageData[key] || null,
  setItem: (key: string, value: string) => {
    localStorageData[key] = value
  },
  removeItem: (key: string) => {
    delete localStorageData[key]
  },
  clear: () => {
    Object.keys(localStorageData).forEach(key => delete localStorageData[key])
  },
  length: 0,
  key: vi.fn(),
}

global.localStorage = localStorageMock as Storage

// Mock sessionStorage with real implementation
const sessionStorageData: Record<string, string> = {}

const sessionStorageMock = {
  getItem: (key: string) => sessionStorageData[key] || null,
  setItem: (key: string, value: string) => {
    sessionStorageData[key] = value
  },
  removeItem: (key: string) => {
    delete sessionStorageData[key]
  },
  clear: () => {
    Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key])
  },
  length: 0,
  key: vi.fn(),
}

global.sessionStorage = sessionStorageMock as Storage

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock fetch global
global.fetch = vi.fn()

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      VITE_RESEND_API_KEY: 'test_api_key',
      VITE_DEFAULT_FROM_EMAIL: 'test@example.com',
      VITE_APP_URL: 'http://localhost:5173',
    },
  },
})

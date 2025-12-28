/**
 * API Client for Backend Communication
 *
 * Centralized Axios instance with authentication and error handling
 */

import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@shared/types';

// API base URL - adjust for production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Centralized API client with authentication
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStoredTokens();

    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling and token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = getStoredTokens();

        if (!tokens?.refreshToken) {
          // No refresh token, redirect to login
          clearStoredTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken
        });

        const { accessToken } = response.data.data;

        // Update stored tokens
        updateAccessToken(accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearStoredTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

/**
 * Token storage helpers
 */
interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export function getStoredTokens(): StoredTokens | null {
  // Primeiro tenta o novo formato
  const tokensJson = localStorage.getItem('auth_tokens');
  if (tokensJson) {
    try {
      return JSON.parse(tokensJson);
    } catch {
      // Ignora erros de parse
    }
  }

  // Fallback para o formato antigo (compatibilidade)
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userJson = localStorage.getItem('user');

  if (accessToken && refreshToken) {
    let user = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson);
      } catch {
        // Ignora erros de parse
      }
    }

    return {
      accessToken,
      refreshToken,
      user
    };
  }

  return null;
}

export function setStoredTokens(tokens: StoredTokens): void {
  // Armazena no formato antigo para compatibilidade
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  if (tokens.user) {
    localStorage.setItem('user', JSON.stringify(tokens.user));
  }
  
  // Também armazena no formato novo
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
}

export function updateAccessToken(accessToken: string): void {
  const tokens = getStoredTokens();
  if (tokens) {
    tokens.accessToken = accessToken;
    setStoredTokens(tokens);
  } else {
    // Se não há tokens armazenados, apenas atualiza o accessToken
    localStorage.setItem('accessToken', accessToken);
  }
}

export function clearStoredTokens(): void {
  localStorage.removeItem('auth_tokens');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  return !!tokens?.accessToken;
}

/**
 * Get current user from storage
 */
export function getCurrentUser(): any | null {
  const tokens = getStoredTokens();
  return tokens?.user || null;
}

/**
 * Fetch with authentication
 * Wrapper around fetch API that automatically adds auth token
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const tokens = getStoredTokens();

  const headers = {
    ...options.headers,
  };

  if (tokens?.accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && tokens?.refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const { accessToken } = refreshData.data;

        // Update stored token
        updateAccessToken(accessToken);

        // Retry original request with new token
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
      } else {
        // Refresh failed, clear tokens and redirect
        clearStoredTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } catch (error) {
      clearStoredTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
}

/**
 * API Client for Backend Communication
 *
 * Centralized Axios instance with authentication and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../../../shared/types';

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
  const tokensJson = localStorage.getItem('auth_tokens');
  if (!tokensJson) return null;

  try {
    return JSON.parse(tokensJson);
  } catch {
    return null;
  }
}

export function setStoredTokens(tokens: StoredTokens): void {
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
}

export function updateAccessToken(accessToken: string): void {
  const tokens = getStoredTokens();
  if (tokens) {
    tokens.accessToken = accessToken;
    setStoredTokens(tokens);
  }
}

export function clearStoredTokens(): void {
  localStorage.removeItem('auth_tokens');
  localStorage.removeItem('user'); // Legacy storage
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

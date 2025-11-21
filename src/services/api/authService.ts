/**
 * Authentication Service (Secure Backend Version)
 *
 * Replaces direct database access with secure backend API calls
 */

import { apiClient, setStoredTokens, clearStoredTokens, getCurrentUser as getStoredUser } from './client';
import type { LoginRequest, LoginResponse, User } from '@shared/types';

/**
 * Login user with email and password
 */
export async function login(credentials: LoginRequest): Promise<User> {
  try {
    const response = await apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/login', credentials);

    const { user, accessToken, refreshToken } = response.data.data;

    // Store tokens and user info
    setStoredTokens({
      accessToken,
      refreshToken,
      user
    });

    return user;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Login failed';
    throw new Error(message);
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  // First check local storage
  const storedUser = getStoredUser();
  if (storedUser) {
    return storedUser;
  }

  // If not in storage, fetch from API
  try {
    const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  } catch (error) {
    return null;
  }
}

/**
 * Logout user
 */
export function logout(): void {
  clearStoredTokens();
}

/**
 * Legacy compatibility - set current user
 */
export function setCurrentUser(user: User): void {
  const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
  tokens.user = user;
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
}

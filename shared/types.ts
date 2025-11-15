/**
 * Shared TypeScript Types for Backend and Frontend
 *
 * These types are shared between API endpoints and frontend services
 * to ensure type safety across the entire application.
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'partner';
  cpf?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ============================================================================
// Email API Types
// ============================================================================

export interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationEmailRequest {
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'report_available' | 'admin_message';
}

// ============================================================================
// HubSpot API Types
// ============================================================================

export interface HubSpotContactRequest {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  [key: string]: any;
}

export interface HubSpotContactResponse {
  id: string;
  properties: Record<string, any>;
}

export interface HubSpotSearchRequest {
  filters?: {
    filterGroups: Array<{
      filters: Array<{
        propertyName: string;
        operator: string;
        value: string;
      }>;
    }>;
  };
  limit?: number;
}

export interface HubSpotValidateProspectRequest {
  email: string;
  companyName: string;
  contactName: string;
  phone?: string;
}

export interface HubSpotValidateProspectResponse {
  contact: any | null;
  company: any | null;
  deals: any[];
  status: 'new' | 'existing' | 'customer';
  validation: {
    emailExists: boolean;
    companyExists: boolean;
    hasActiveDeals: boolean;
    isCustomer: boolean;
  };
}

// ============================================================================
// Gemini API Types
// ============================================================================

export interface GeminiRequest {
  message: string;
  context?: string;
}

export interface GeminiResponse {
  response: string;
  isFromAI: boolean;
  tokens?: number;
}

export interface GeminiSalesPitchRequest {
  productName: string;
  clientContext?: string;
}

export interface GeminiSalesPitchResponse {
  pitch: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
  timestamp: string;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitError extends ApiError {
  rateLimitInfo: RateLimitInfo;
}

/**
 * Shared TypeScript Types for Partners Platform
 *
 * Replaces 'any' types across the application for better type safety
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'partner';
  cpf?: string;
  phone?: string;
  manager_slug?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  permissions?: UserPermissions;
}

export interface UserPermissions {
  canViewReports: boolean;
  canManageClients: boolean;
  canAccessAdmin: boolean;
  canManageReferrals: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============================================================================
// Client Types
// ============================================================================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  status: ClientStatus;
  partnerId: string;
  partnerName?: string;
  registrationDate: string;
  lastContactDate?: string;
  notes?: string;
  hubspotId?: string;
  netsuiteId?: string;
}

export type ClientStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'churned';

// ============================================================================
// Referral Types
// ============================================================================

export interface Referral {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  partnerId: string;
  partnerName: string;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  conversionDate?: string;
  commission?: number;
  notes?: string;
}

export type ReferralStatus =
  | 'pending'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'rejected'
  | 'lost';

// ============================================================================
// Report Types
// ============================================================================

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  month: string;
  year: number;
  generatedAt: string;
  generatedBy: string;
  fileUrl?: string;
  status: 'processing' | 'ready' | 'error';
  metrics?: ReportMetrics;
}

export type ReportType =
  | 'monthly_summary'
  | 'commission'
  | 'client_activity'
  | 'referral_performance'
  | 'custom';

export interface ReportMetrics {
  totalClients?: number;
  newClients?: number;
  totalRevenue?: number;
  totalCommission?: number;
  conversionRate?: number;
  [key: string]: number | undefined;
}

// ============================================================================
// HubSpot Integration Types
// ============================================================================

export interface HubSpotContact {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  company?: string;
  lifecyclestage?: string;
  createdate: string;
  lastmodifieddate: string;
  properties?: Record<string, unknown>;
}

export interface HubSpotSyncResult {
  success: boolean;
  contactsCreated: number;
  contactsUpdated: number;
  contactsFailed: number;
  errors?: Array<{
    contact: string;
    error: string;
  }>;
}

// ============================================================================
// NetSuite Integration Types
// ============================================================================

export interface NetSuiteCustomer {
  id: string;
  entityId: string;
  companyName: string;
  email: string;
  phone?: string;
  status: string;
  dateCreated: string;
  lastModifiedDate: string;
}

export interface NetSuiteSyncResult {
  success: boolean;
  customersCreated: number;
  customersUpdated: number;
  customersFailed: number;
  errors?: Array<{
    customer: string;
    error: string;
  }>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
  message?: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalReferrals: number;
  pendingReferrals: number;
  monthlyRevenue: number;
  monthlyCommission: number;
  conversionRate: number;
  growthRate: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Email Service Types
// ============================================================================

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  plainTextContent?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    reportReady: boolean;
    newReferral: boolean;
  };
  preferences: {
    language: 'pt-BR' | 'en-US';
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  integrations: {
    hubspot: boolean;
    netsuite: boolean;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string | number;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Error Handler Middleware
 *
 * Provides centralized error handling for API endpoints
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Wrap handler with error handling
 */
export function withErrorHandler(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleError(error, req, res);
    }
  };
}

/**
 * Handle errors and send appropriate responses
 */
function handleError(error: any, req: VercelRequest, res: VercelResponse): void {
  // Log error for debugging (exclude sensitive information)
  console.error('API Error:', {
    method: req.method,
    url: req.url,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });

  // Handle known error types
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle authentication errors
  if (error.message?.includes('token') || error.message?.includes('auth')) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle rate limit errors
  if (error.message?.includes('rate limit')) {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
}

/**
 * Create standardized success response
 */
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create standardized error response
 */
export function errorResponse(error: string, statusCode: number = 500, code?: string) {
  throw new ApiError(error, statusCode, code);
}

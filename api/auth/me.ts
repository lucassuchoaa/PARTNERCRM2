/**
 * Get Current User API Endpoint
 *
 * Returns current authenticated user information
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse } from '../_middleware/errorHandler';
import { requireAuth } from '../_middleware/auth';
import { apiRateLimit } from '../_middleware/rateLimit';
import { JWTPayload } from '../../shared/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  await apiRateLimit(req, res, async () => {
    await requireAuth(async (req, res, user: JWTPayload) => {
      // In production, fetch full user details from database
      // For now, return JWT payload
      res.status(200).json(successResponse(user, 'User retrieved successfully'));
    })(req, res);
  });
}

export default withCORS(withErrorHandler(handler));

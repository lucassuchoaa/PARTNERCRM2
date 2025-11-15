/**
 * Refresh Token API Endpoint
 *
 * Refreshes access token using refresh token
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse, errorResponse } from '../_middleware/errorHandler';
import { apiRateLimit } from '../_middleware/rateLimit';
import { verifyRefreshToken, generateAccessToken } from '../_middleware/auth';
import { RefreshTokenRequest, RefreshTokenResponse } from '../../shared/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  await apiRateLimit(req, res, async () => {
    const { refreshToken } = req.body as RefreshTokenRequest;

    if (!refreshToken) {
      return errorResponse('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
    }

    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Generate new access token
      const newAccessToken = generateAccessToken(
        payload.userId,
        payload.email,
        payload.role
      );

      const response: RefreshTokenResponse = {
        accessToken: newAccessToken,
        expiresIn: 3600 // 1 hour in seconds
      };

      res.status(200).json(successResponse(response, 'Token refreshed successfully'));
    } catch (error: any) {
      return errorResponse(error.message || 'Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  });
}

export default withCORS(withErrorHandler(handler));

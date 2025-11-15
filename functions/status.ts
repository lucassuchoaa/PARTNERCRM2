/**
 * Public Status Endpoint
 *
 * Returns basic system information and status
 * Safe to expose publicly - no sensitive data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { version } from '../package.json';

interface StatusResponse {
  status: 'operational' | 'degraded' | 'down';
  version: string;
  buildTime: string;
  uptime: number;
  environment: string;
  region: string;
  timestamp: string;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const status: StatusResponse = {
    status: 'operational',
    version: version || '1.0.0',
    buildTime: process.env.VERCEL_GIT_COMMIT_SHA
      ? new Date(parseInt(process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 8), 16) * 1000).toISOString()
      : new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    environment: process.env.NODE_ENV || 'production',
    region: process.env.VERCEL_REGION || 'unknown',
    timestamp: new Date().toISOString(),
  };

  // Cache for 60 seconds
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  return res.status(200).json(status);
}

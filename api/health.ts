/**
 * Health Check Endpoint
 *
 * Verifies system health and external dependencies
 * Returns 200 if healthy, 503 if unhealthy
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    database?: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    hubspot?: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    gemini?: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    memory?: {
      used: number;
      available: number;
      percentage: number;
    };
  };
  errors?: string[];
}

/**
 * Check HubSpot API connectivity
 */
async function checkHubSpot(): Promise<{ status: 'up' | 'down'; responseTime?: number }> {
  const HUBSPOT_API_KEY = process.env.VITE_HUBSPOT_API_KEY;

  if (!HUBSPOT_API_KEY) {
    return { status: 'down' };
  }

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    const responseTime = Date.now() - startTime;

    return {
      status: response.ok ? 'up' : 'down',
      responseTime,
    };
  } catch (error) {
    return { status: 'down' };
  }
}

/**
 * Check Gemini API connectivity
 */
async function checkGemini(): Promise<{ status: 'up' | 'down'; responseTime?: number }> {
  const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return { status: 'down' };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      {
        signal: AbortSignal.timeout(5000), // 5s timeout
      }
    );

    const responseTime = Date.now() - startTime;

    return {
      status: response.ok ? 'up' : 'down',
      responseTime,
    };
  } catch (error) {
    return { status: 'down' };
  }
}

/**
 * Get memory usage
 */
function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const used = usage.heapUsed / 1024 / 1024; // MB
    const total = usage.heapTotal / 1024 / 1024; // MB

    return {
      used: Math.round(used),
      available: Math.round(total - used),
      percentage: Math.round((used / total) * 100),
    };
  }

  return {
    used: 0,
    available: 0,
    percentage: 0,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Perform health checks in parallel
    const [hubspotCheck, geminiCheck] = await Promise.all([
      checkHubSpot().catch(err => {
        errors.push(`HubSpot check failed: ${err.message}`);
        return { status: 'down' as const };
      }),
      checkGemini().catch(err => {
        errors.push(`Gemini check failed: ${err.message}`);
        return { status: 'down' as const };
      }),
    ]);

    const memoryUsage = getMemoryUsage();

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    const criticalServicesDown =
      hubspotCheck.status === 'down' || geminiCheck.status === 'down';

    if (criticalServicesDown) {
      status = 'degraded';
    }

    if (memoryUsage.percentage > 90) {
      status = 'unhealthy';
      errors.push('Memory usage critical');
    }

    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
      checks: {
        hubspot: hubspotCheck,
        gemini: geminiCheck,
        memory: memoryUsage,
      },
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    const responseTime = Date.now() - startTime;

    // Set appropriate status code
    const statusCode = status === 'unhealthy' ? 503 : 200;

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Response-Time', `${responseTime}ms`);

    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: 0,
      checks: {},
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    });
  }
}

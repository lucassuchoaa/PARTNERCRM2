import { getSupabaseClient } from '../_lib/supabaseClient';

/**
 * Verify Supabase Setup API
 * Checks if all tables and storage bucket are configured correctly
 */

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    checks: {
      connection: { status: 'unknown', message: '' },
      tables: { status: 'unknown', tables: [], message: '' },
      storage: { status: 'unknown', buckets: [], message: '' },
      data: { status: 'unknown', counts: {}, message: '' }
    },
    errors: []
  };

  let supabase;

  try {
    // 1. Check Supabase connection
    try {
      supabase = getSupabaseClient();
      results.checks.connection.status = 'ok';
      results.checks.connection.message = 'Supabase client initialized successfully';
    } catch (error) {
      results.success = false;
      results.checks.connection.status = 'error';
      results.checks.connection.message = error.message;
      results.errors.push('Connection failed: ' + error.message);

      return res.status(500).json(results);
    }

    // 2. Check tables
    try {
      const requiredTables = [
        'users',
        'products',
        'pricing_plans',
        'support_materials',
        'remuneration_tables'
      ];

      const tableChecks = await Promise.all(
        requiredTables.map(async (table) => {
          try {
            const { error } = await supabase
              .from(table)
              .select('id')
              .limit(1);

            return { table, exists: !error, error: error?.message };
          } catch (e) {
            return { table, exists: false, error: e.message };
          }
        })
      );

      const existingTables = tableChecks.filter(t => t.exists).map(t => t.table);
      const missingTables = tableChecks.filter(t => !t.exists);

      results.checks.tables.tables = existingTables;

      if (existingTables.length === requiredTables.length) {
        results.checks.tables.status = 'ok';
        results.checks.tables.message = `All ${requiredTables.length} tables found`;
      } else {
        results.success = false;
        results.checks.tables.status = 'error';
        results.checks.tables.message = `Missing tables: ${missingTables.map(t => t.table).join(', ')}`;
        results.errors.push(`Tables missing: ${missingTables.map(t => t.table).join(', ')}`);
      }
    } catch (error) {
      results.success = false;
      results.checks.tables.status = 'error';
      results.checks.tables.message = 'Failed to check tables: ' + error.message;
      results.errors.push('Tables check failed');
    }

    // 3. Check storage buckets
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        throw error;
      }

      const partnerFilesBucket = buckets?.find(b => b.name === 'partner-files');

      results.checks.storage.buckets = buckets?.map(b => ({
        name: b.name,
        public: b.public,
        id: b.id
      })) || [];

      if (partnerFilesBucket) {
        results.checks.storage.status = 'ok';
        results.checks.storage.message = `Bucket 'partner-files' found (${partnerFilesBucket.public ? 'PUBLIC' : 'PRIVATE'})`;

        if (!partnerFilesBucket.public) {
          results.checks.storage.message += ' ⚠️ Warning: Bucket is not public. Public URLs may not work.';
        }
      } else {
        results.success = false;
        results.checks.storage.status = 'error';
        results.checks.storage.message = "Bucket 'partner-files' not found. Create it in Supabase Storage.";
        results.errors.push('Storage bucket missing');
      }
    } catch (error) {
      results.success = false;
      results.checks.storage.status = 'error';
      results.checks.storage.message = 'Failed to check storage: ' + error.message;
      results.errors.push('Storage check failed');
    }

    // 4. Check data counts (if tables exist)
    if (results.checks.tables.status === 'ok') {
      try {
        const counts = {};

        for (const table of results.checks.tables.tables) {
          try {
            const { count, error } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });

            counts[table] = error ? 'error' : count;
          } catch (e) {
            counts[table] = 'error';
          }
        }

        results.checks.data.counts = counts;
        results.checks.data.status = 'ok';
        results.checks.data.message = 'Data counts retrieved';
      } catch (error) {
        results.checks.data.status = 'warning';
        results.checks.data.message = 'Could not retrieve data counts: ' + error.message;
      }
    }

    // Final status
    const statusCode = results.success ? 200 : 500;
    return res.status(statusCode).json(results);

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

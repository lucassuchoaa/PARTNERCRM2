import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased from 2s to 30s for production stability
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit in production - allow graceful recovery
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

export const query = async (text: string, params?: any[], retries = 3) => {
  const start = Date.now();
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error: any) {
      lastError = error;
      const isConnectionError = error.message?.includes('Connection terminated') ||
                                error.message?.includes('timeout') ||
                                error.code === 'ECONNRESET';
      
      if (isConnectionError && attempt < retries) {
        console.warn(`⚠️ Database connection error (attempt ${attempt}/${retries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
      console.error('❌ Database query error:', error);
      console.error('Query text:', text);
      console.error('Query params:', params);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error detail:', error.detail);
      throw error;
    }
  }
  
  throw lastError;
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  const releaseChecked = () => {
    client.removeListener('error', clientErrorListener);
    release();
  };
  
  const clientErrorListener = (err: Error) => {
    console.error('Client error:', err.stack);
    releaseChecked();
  };
  
  client.on('error', clientErrorListener);
  client.release = releaseChecked;
  
  return { query, client, release: releaseChecked };
};

export { pool };
export default pool;

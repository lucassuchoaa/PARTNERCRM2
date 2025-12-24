#!/usr/bin/env node
/**
 * Script de Verificação de DATABASE_URL
 *
 * Este script testa a conexão com o banco PostgreSQL usando a DATABASE_URL
 * Ideal para verificar se os Replit Secrets estão configurados corretamente
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(80));
  log(message, 'bright');
  console.log('='.repeat(80) + '\n');
}

function maskSecret(value, showChars = 20) {
  if (!value) return 'NOT_SET';
  if (value.length <= showChars) return '*'.repeat(value.length);
  return value.substring(0, showChars) + '...[MASKED]';
}

async function verifyDatabaseConnection() {
  logHeader('DATABASE CONNECTION VERIFICATION');

  // 1. Verificar se DATABASE_URL existe
  log('Step 1: Checking DATABASE_URL environment variable', 'cyan');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    log('ERROR: DATABASE_URL is not set!', 'red');
    log('Please configure DATABASE_URL in Replit Secrets', 'yellow');
    process.exit(1);
  }

  log('DATABASE_URL: ' + maskSecret(databaseUrl, 30), 'green');

  // 2. Parse DATABASE_URL
  log('\nStep 2: Parsing DATABASE_URL', 'cyan');
  try {
    const url = new URL(databaseUrl);
    log(`Protocol: ${url.protocol}`, 'blue');
    log(`Host: ${url.hostname}`, 'blue');
    log(`Port: ${url.port || '5432'}`, 'blue');
    log(`Database: ${url.pathname.substring(1)}`, 'blue');
    log(`Username: ${url.username}`, 'blue');
    log(`Password: ${maskSecret(url.password, 10)}`, 'blue');
    log(`SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`, 'blue');

    // Verificar se é Neon
    const isNeon = url.hostname.includes('neon.tech');
    if (isNeon) {
      log('\nDetected PostgreSQL provider: Neon', 'green');
    } else {
      log('\nWarning: This does not appear to be a Neon database', 'yellow');
    }
  } catch (error) {
    log('ERROR: Invalid DATABASE_URL format!', 'red');
    log(error.message, 'red');
    process.exit(1);
  }

  // 3. Testar conexão básica
  log('\nStep 3: Testing database connection', 'cyan');
  let pool;

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
      max: 1,
      connectionTimeoutMillis: 10000,
    });

    log('Attempting to connect...', 'blue');
    const client = await pool.connect();
    log('Connection successful!', 'green');

    // 4. Verificar versão do PostgreSQL
    log('\nStep 4: Checking PostgreSQL version', 'cyan');
    const versionResult = await client.query('SELECT version()');
    log(versionResult.rows[0].version, 'blue');

    // 5. Verificar tabelas existentes
    log('\nStep 5: Checking database tables', 'cyan');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      log('No tables found in database (fresh database)', 'yellow');
    } else {
      log(`Found ${tablesResult.rows.length} tables:`, 'green');
      tablesResult.rows.forEach(row => {
        log(`  - ${row.table_name}`, 'blue');
      });
    }

    // 6. Verificar conexões ativas
    log('\nStep 6: Checking active connections', 'cyan');
    const connectionsResult = await client.query(`
      SELECT count(*) as connection_count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    log(`Active connections: ${connectionsResult.rows[0].connection_count}`, 'blue');

    // 7. Verificar tamanho do banco
    log('\nStep 7: Checking database size', 'cyan');
    const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    log(`Database size: ${sizeResult.rows[0].size}`, 'blue');

    client.release();
    await pool.end();

    logHeader('VERIFICATION COMPLETED SUCCESSFULLY');
    log('Database connection is working correctly!', 'green');
    log('All checks passed!', 'green');

  } catch (error) {
    log('\nERROR: Failed to connect to database!', 'red');
    log(`Error message: ${error.message}`, 'red');

    if (error.code) {
      log(`Error code: ${error.code}`, 'red');
    }

    log('\nTroubleshooting tips:', 'yellow');
    log('1. Verify DATABASE_URL is correct in Replit Secrets', 'yellow');
    log('2. Check if your Neon database is active (not paused)', 'yellow');
    log('3. Verify network connectivity to the database', 'yellow');
    log('4. Check if SSL mode is correctly configured', 'yellow');

    if (pool) {
      await pool.end();
    }

    process.exit(1);
  }
}

// Executar verificação
verifyDatabaseConnection().catch(error => {
  log('Unexpected error:', 'red');
  console.error(error);
  process.exit(1);
});

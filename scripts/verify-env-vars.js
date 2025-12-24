#!/usr/bin/env node
/**
 * Script de Verificação de Variáveis de Ambiente
 *
 * Verifica se todas as variáveis necessárias estão configuradas
 * e se seus valores são válidos
 */

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

// Definição de variáveis de ambiente necessárias
const ENV_VARS = {
  // OBRIGATÓRIAS
  required: [
    {
      name: 'DATABASE_URL',
      description: 'PostgreSQL connection string (Neon)',
      validate: (val) => val && val.startsWith('postgresql://'),
      maskChars: 30,
    },
    {
      name: 'SESSION_SECRET',
      description: 'Secret for session management',
      validate: (val) => val && val.length >= 32,
      maskChars: 20,
    },
  ],

  // NECESSÁRIAS PARA PRODUÇÃO
  production: [
    {
      name: 'JWT_ACCESS_SECRET',
      description: 'Secret for JWT access tokens',
      validate: (val) => val && val.length >= 32,
      maskChars: 20,
    },
    {
      name: 'JWT_REFRESH_SECRET',
      description: 'Secret for JWT refresh tokens',
      validate: (val) => val && val.length >= 32,
      maskChars: 20,
    },
    {
      name: 'NODE_ENV',
      description: 'Environment mode',
      validate: (val) => ['development', 'production', 'test'].includes(val),
      maskChars: 999, // Don't mask
    },
  ],

  // NECESSÁRIAS PARA REPLIT AUTH
  replitAuth: [
    {
      name: 'REPL_ID',
      description: 'Replit deployment ID (auto-set)',
      validate: (val) => val && val.length > 0,
      maskChars: 20,
    },
    {
      name: 'ISSUER_URL',
      description: 'Replit OIDC issuer URL',
      validate: (val) => !val || val.includes('replit.com'),
      maskChars: 999, // Don't mask
      optional: true,
    },
  ],

  // OPCIONAIS
  optional: [
    {
      name: 'PORT',
      description: 'Server port',
      validate: (val) => !val || !isNaN(parseInt(val)),
      maskChars: 999,
    },
    {
      name: 'RESEND_API_KEY',
      description: 'Resend email service API key',
      validate: (val) => !val || val.startsWith('re_'),
      maskChars: 20,
    },
    {
      name: 'HUBSPOT_API_KEY',
      description: 'HubSpot CRM integration key',
      validate: (val) => true,
      maskChars: 20,
    },
    {
      name: 'STRIPE_SECRET_KEY',
      description: 'Stripe payment gateway key',
      validate: (val) => !val || val.startsWith('sk_'),
      maskChars: 20,
    },
    {
      name: 'SENTRY_DSN',
      description: 'Sentry error tracking DSN',
      validate: (val) => !val || val.startsWith('https://'),
      maskChars: 30,
    },
  ],
};

function checkEnvVar(envVar, status) {
  const value = process.env[envVar.name];
  const isSet = !!value;
  const isValid = isSet && envVar.validate(value);

  let statusIcon = '❌';
  let statusText = 'MISSING';
  let statusColor = 'red';

  if (isSet && isValid) {
    statusIcon = '✅';
    statusText = 'OK';
    statusColor = 'green';
  } else if (isSet && !isValid) {
    statusIcon = '⚠️';
    statusText = 'INVALID';
    statusColor = 'yellow';
  } else if (envVar.optional) {
    statusIcon = '⭕';
    statusText = 'NOT_SET (optional)';
    statusColor = 'blue';
  }

  console.log(`${statusIcon} ${envVar.name.padEnd(25)} ${statusText.padEnd(20)} ${maskSecret(value, envVar.maskChars)}`);

  if (envVar.description) {
    log(`   ${envVar.description}`, 'cyan');
  }

  if (!isValid && isSet) {
    log(`   Warning: Value does not meet validation requirements`, 'yellow');
  }

  return { name: envVar.name, isSet, isValid, required: status === 'required' };
}

function verifyEnvironmentVariables() {
  logHeader('ENVIRONMENT VARIABLES VERIFICATION');

  const results = {
    required: [],
    production: [],
    replitAuth: [],
    optional: [],
  };

  // Check required variables
  log('REQUIRED VARIABLES (Critical - Server won\'t start without these):', 'bright');
  console.log('─'.repeat(80));
  ENV_VARS.required.forEach(envVar => {
    results.required.push(checkEnvVar(envVar, 'required'));
  });

  // Check production variables
  log('\n\nPRODUCTION VARIABLES (Needed for production deployment):', 'bright');
  console.log('─'.repeat(80));
  ENV_VARS.production.forEach(envVar => {
    results.production.push(checkEnvVar(envVar, 'production'));
  });

  // Check Replit Auth variables
  log('\n\nREPLIT AUTH VARIABLES (Needed for Replit authentication):', 'bright');
  console.log('─'.repeat(80));
  ENV_VARS.replitAuth.forEach(envVar => {
    results.replitAuth.push(checkEnvVar(envVar, 'replitAuth'));
  });

  // Check optional variables
  log('\n\nOPTIONAL VARIABLES (Nice to have, but not critical):', 'bright');
  console.log('─'.repeat(80));
  ENV_VARS.optional.forEach(envVar => {
    results.optional.push(checkEnvVar(envVar, 'optional'));
  });

  // Summary
  logHeader('SUMMARY');

  const missingRequired = results.required.filter(r => !r.isSet);
  const invalidRequired = results.required.filter(r => r.isSet && !r.isValid);
  const missingProduction = results.production.filter(r => !r.isSet);
  const missingReplitAuth = results.replitAuth.filter(r => !r.isSet && !ENV_VARS.replitAuth.find(v => v.name === r.name).optional);

  if (missingRequired.length > 0) {
    log(`❌ CRITICAL: ${missingRequired.length} required variable(s) missing:`, 'red');
    missingRequired.forEach(r => log(`   - ${r.name}`, 'red'));
  } else {
    log('✅ All required variables are set', 'green');
  }

  if (invalidRequired.length > 0) {
    log(`\n⚠️  WARNING: ${invalidRequired.length} required variable(s) have invalid values:`, 'yellow');
    invalidRequired.forEach(r => log(`   - ${r.name}`, 'yellow'));
  }

  if (missingProduction.length > 0) {
    log(`\n⚠️  WARNING: ${missingProduction.length} production variable(s) missing:`, 'yellow');
    missingProduction.forEach(r => log(`   - ${r.name}`, 'yellow'));
  }

  if (missingReplitAuth.length > 0) {
    log(`\n⚠️  INFO: ${missingReplitAuth.length} Replit Auth variable(s) missing:`, 'yellow');
    missingReplitAuth.forEach(r => log(`   - ${r.name}`, 'yellow'));
    log('   Replit Auth will be disabled', 'yellow');
  } else {
    log('\n✅ Replit Auth variables are configured', 'green');
  }

  // Environment detection
  log('\n\nENVIRONMENT DETECTION:', 'bright');
  const nodeEnv = process.env.NODE_ENV || 'development';
  log(`Current environment: ${nodeEnv}`, 'blue');

  if (nodeEnv === 'production' && missingProduction.length > 0) {
    log('⚠️  Running in production mode with missing production variables!', 'yellow');
  }

  // Exit code
  if (missingRequired.length > 0 || invalidRequired.length > 0) {
    log('\n❌ Environment check FAILED', 'red');
    process.exit(1);
  } else {
    log('\n✅ Environment check PASSED', 'green');
    process.exit(0);
  }
}

// Execute verification
verifyEnvironmentVariables();

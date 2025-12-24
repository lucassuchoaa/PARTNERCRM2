#!/usr/bin/env node

/**
 * Script de Verificação de Secrets
 * Verifica quais secrets estão configurados e quais estão faltando
 */

console.log('═══════════════════════════════════════════════════════════════');
console.log('           VERIFICAÇÃO DE REPLIT SECRETS                       ');
console.log('═══════════════════════════════════════════════════════════════\n');

const requiredSecrets = [
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL Neon connection string',
    critical: true,
    pattern: /^postgresql:\/\//
  },
  {
    name: 'SESSION_SECRET',
    description: 'Session encryption secret',
    critical: true,
    minLength: 32
  },
  {
    name: 'JWT_ACCESS_SECRET',
    description: 'JWT access token secret',
    critical: true,
    minLength: 64
  },
  {
    name: 'JWT_REFRESH_SECRET',
    description: 'JWT refresh token secret',
    critical: true,
    minLength: 64
  },
  {
    name: 'NODE_ENV',
    description: 'Environment (production/development)',
    critical: true,
    expected: 'production'
  },
  {
    name: 'RESEND_API_KEY',
    description: 'Email service API key',
    critical: false,
    pattern: /^re_/
  },
  {
    name: 'REPL_ID',
    description: 'Replit ID (auto-configured)',
    critical: false
  }
];

let allOk = true;
let criticalMissing = 0;

console.log('Verificando secrets...\n');

requiredSecrets.forEach(secret => {
  const value = process.env[secret.name];
  const exists = !!value;

  let status = '';
  let icon = '';
  let message = '';

  if (!exists) {
    icon = secret.critical ? '❌' : '⚠️';
    status = secret.critical ? 'FALTANDO (CRÍTICO!)' : 'Não configurado';
    message = `   → ${secret.description}`;
    if (secret.critical) {
      criticalMissing++;
      allOk = false;
    }
  } else {
    // Validar formato se necessário
    let valid = true;

    if (secret.pattern && !secret.pattern.test(value)) {
      valid = false;
      icon = '⚠️';
      status = 'Formato inválido';
      message = `   → Esperado: ${secret.pattern}`;
    } else if (secret.minLength && value.length < secret.minLength) {
      valid = false;
      icon = '⚠️';
      status = `Muito curto (${value.length} chars, mín: ${secret.minLength})`;
    } else if (secret.expected && value !== secret.expected) {
      valid = false;
      icon = '⚠️';
      status = `Valor incorreto (esperado: ${secret.expected}, atual: ${value})`;
    } else {
      icon = '✅';
      status = 'Configurado';
      message = `   → ${secret.description}`;

      // Mostrar preview parcial do valor
      if (value.length > 20) {
        message += `\n   → Valor: ${value.substring(0, 20)}...`;
      }
    }

    if (!valid && secret.critical) {
      allOk = false;
      criticalMissing++;
    }
  }

  console.log(`${icon} ${secret.name}`);
  console.log(`   Status: ${status}`);
  if (message) console.log(message);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('                        RESUMO                                 ');
console.log('═══════════════════════════════════════════════════════════════\n');

if (allOk && criticalMissing === 0) {
  console.log('✅ TODOS OS SECRETS CRÍTICOS ESTÃO CONFIGURADOS!');
  console.log('');
  console.log('Você pode fazer o deployment agora:');
  console.log('  1. Clique em "Deploy" 🚀 no topo da interface');
  console.log('  2. Aguarde 2-5 minutos');
  console.log('  3. Acesse a URL gerada');
  console.log('');
  process.exit(0);
} else {
  console.log(`❌ FALTAM ${criticalMissing} SECRETS CRÍTICOS!\n`);
  console.log('VOCÊ PRECISA ADICIONAR OS SECRETS FALTANTES:\n');
  console.log('Como adicionar:');
  console.log('  1. Abra o painel de Secrets (ícone 🔒)');
  console.log('  2. Clique em "New Secret"');
  console.log('  3. Copie os valores de: .env.production');
  console.log('  4. Cole no painel de Secrets\n');
  console.log('Arquivo de referência: .env.production');
  console.log('Guia completo: secrets-values.txt\n');
  process.exit(1);
}

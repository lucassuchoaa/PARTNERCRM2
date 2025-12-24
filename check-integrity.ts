/**
 * Script de Verificacao de Integridade
 * Verifica problemas de integridade referencial
 */

import { query } from './server/db';

async function checkIntegrity() {
  console.log('VERIFICACAO DE INTEGRIDADE REFERENCIAL\n');

  // 1. Prospects com partner_id invalido
  console.log('1. Prospects com partner_id invalido:');
  const invalidProspects = await query(`
    SELECT p.id, p.company_name, p.cnpj, p.partner_id, p.status
    FROM prospects p
    WHERE p.partner_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM users u WHERE u.id = p.partner_id::text
    )
  `);

  if (invalidProspects.rows.length > 0) {
    console.log(`\nEncontrados ${invalidProspects.rows.length} prospects com partner_id invalido:`);
    invalidProspects.rows.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.company_name} (${p.cnpj}) - partner_id: ${p.partner_id} - status: ${p.status}`);
    });

    // Listar usuarios existentes
    console.log('\n  Usuarios existentes no sistema:');
    const users = await query('SELECT id, email, name, role FROM users ORDER BY email');
    users.rows.forEach(u => {
      console.log(`    - ID: ${u.id}, Email: ${u.email}, Nome: ${u.name}, Role: ${u.role}`);
    });
  } else {
    console.log('  OK - Nenhum prospect com partner_id invalido');
  }

  // 2. Clients com partner_id invalido
  console.log('\n2. Clients com partner_id invalido:');
  const invalidClients = await query(`
    SELECT c.id, c.name, c.cnpj, c.partner_id, c.status
    FROM clients c
    WHERE c.partner_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM users u WHERE u.id = c.partner_id::text
    )
  `);

  if (invalidClients.rows.length > 0) {
    console.log(`\nEncontrados ${invalidClients.rows.length} clients com partner_id invalido:`);
    invalidClients.rows.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name} (${c.cnpj}) - partner_id: ${c.partner_id} - status: ${c.status}`);
    });
  } else {
    console.log('  OK - Nenhum client com partner_id invalido');
  }

  process.exit(0);
}

checkIntegrity();

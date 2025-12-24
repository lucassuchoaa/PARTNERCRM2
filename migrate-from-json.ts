/**
 * Script de Migração: db.json → PostgreSQL
 *
 * Migra todos os dados do arquivo db.json para o banco PostgreSQL
 * de forma segura, respeitando constraints e evitando duplicações.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DbJsonData {
  users?: any[];
  prospects?: any[];
  clients?: any[];
  support_materials?: any[];
  remunerationTables?: any[];
  notifications?: any[];
}

async function migrateData() {
  console.log('🚀 Iniciando migração do db.json para PostgreSQL...\n');

  // Ler o arquivo db.json
  const dbJsonPath = path.join(__dirname, 'db.json');
  if (!fs.existsSync(dbJsonPath)) {
    console.error('❌ Arquivo db.json não encontrado!');
    process.exit(1);
  }

  const dbData: DbJsonData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
  console.log('✅ Arquivo db.json carregado com sucesso\n');

  let stats = {
    users: { total: 0, inserted: 0, skipped: 0, errors: 0 },
    prospects: { total: 0, inserted: 0, skipped: 0, errors: 0 },
    clients: { total: 0, inserted: 0, skipped: 0, errors: 0 },
    support_materials: { total: 0, inserted: 0, skipped: 0, errors: 0 },
    remuneration_tables: { total: 0, inserted: 0, skipped: 0, errors: 0 },
  };

  try {
    // =========================================================================
    // 1. MIGRAR USUÁRIOS
    // =========================================================================
    if (dbData.users && dbData.users.length > 0) {
      console.log('📋 Migrando USUÁRIOS...');
      stats.users.total = dbData.users.length;

      for (const user of dbData.users) {
        try {
          // Verificar se já existe (por email)
          const existing = await query(
            'SELECT id FROM users WHERE email = $1',
            [user.email]
          );

          if (existing.rows.length > 0) {
            console.log(`  ⏭️  Usuário já existe: ${user.email}`);
            stats.users.skipped++;
            continue;
          }

          // Inserir usuário
          await query(
            `INSERT INTO users (
              id, email, name, password, role, status,
              manager_id, remuneration_table_ids, created_at, last_login, permissions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              user.id || `migrated_${Date.now()}_${Math.random()}`,
              user.email,
              user.name,
              user.password,
              user.role,
              user.status || 'active',
              user.managerId || null,
              user.remunerationTableIds || user.remunerationTableId ? [user.remunerationTableId] : [],
              user.createdAt || new Date().toISOString(),
              user.lastLogin || null,
              user.permissions || []
            ]
          );

          console.log(`  ✅ Inserido: ${user.email}`);
          stats.users.inserted++;
        } catch (error: any) {
          console.error(`  ❌ Erro ao inserir ${user.email}:`, error.message);
          stats.users.errors++;
        }
      }
      console.log('');
    }

    // =========================================================================
    // 2. MIGRAR TABELAS DE REMUNERAÇÃO
    // =========================================================================
    if (dbData.remunerationTables && dbData.remunerationTables.length > 0) {
      console.log('📋 Migrando TABELAS DE REMUNERAÇÃO...');
      stats.remuneration_tables.total = dbData.remunerationTables.length;

      for (const table of dbData.remunerationTables) {
        try {
          // Verificar se já existe (por id, se existir)
          if (table.id) {
            const existing = await query(
              'SELECT id FROM remuneration_tables WHERE id = $1',
              [table.id]
            );

            if (existing.rows.length > 0) {
              console.log(`  ⏭️  Tabela já existe: ID ${table.id}`);
              stats.remuneration_tables.skipped++;
              continue;
            }
          }

          // Inserir tabela de remuneração
          await query(
            `INSERT INTO remuneration_tables (
              employee_range_start, employee_range_end,
              finder_negotiation_margin, max_company_cashback,
              final_finder_cashback, description, value_type, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              table.employeeRangeStart || table.employee_range_start || '0',
              table.employeeRangeEnd || table.employee_range_end || null,
              table.finderNegotiationMargin || table.finder_negotiation_margin || '0%',
              table.maxCompanyCashback || table.max_company_cashback || '0%',
              table.finalFinderCashback || table.final_finder_cashback || '0%',
              table.description || null,
              table.valueType || table.value_type || 'percentage',
              table.createdAt || new Date().toISOString()
            ]
          );

          console.log(`  ✅ Inserida: ${table.employeeRangeStart || table.employee_range_start}`);
          stats.remuneration_tables.inserted++;
        } catch (error: any) {
          console.error(`  ❌ Erro ao inserir tabela:`, error.message);
          stats.remuneration_tables.errors++;
        }
      }
      console.log('');
    }

    // =========================================================================
    // 3. MIGRAR PROSPECTS (INDICAÇÕES)
    // =========================================================================
    if (dbData.prospects && dbData.prospects.length > 0) {
      console.log('📋 Migrando PROSPECTS (Indicações)...');
      stats.prospects.total = dbData.prospects.length;

      for (const prospect of dbData.prospects) {
        try {
          // Verificar se já existe (por CNPJ + email)
          const existing = await query(
            'SELECT id FROM prospects WHERE cnpj = $1 AND email = $2',
            [prospect.cnpj, prospect.email]
          );

          if (existing.rows.length > 0) {
            console.log(`  ⏭️  Prospect já existe: ${prospect.companyName} (${prospect.cnpj})`);
            stats.prospects.skipped++;
            continue;
          }

          // Mapear status e campos de validação
          const adminValidation = prospect.adminValidation || {};

          await query(
            `INSERT INTO prospects (
              company_name, contact_name, email, phone, cnpj,
              employees, segment, status, partner_id,
              submitted_at, validated_at, validated_by,
              validation_notes, is_approved, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              prospect.companyName,
              prospect.contactName,
              prospect.email,
              prospect.phone,
              prospect.cnpj,
              prospect.employees || prospect.employeeCount?.toString() || '0',
              prospect.segment,
              prospect.status || 'pending',
              prospect.partnerId?.toString() || null,
              prospect.submittedAt || new Date().toISOString(),
              adminValidation.validatedAt || null,
              adminValidation.validatedBy || null,
              adminValidation.notes || null,
              adminValidation.isApproved || prospect.status === 'approved' || false,
              prospect.createdAt || prospect.submittedAt || new Date().toISOString()
            ]
          );

          console.log(`  ✅ Inserido: ${prospect.companyName}`);
          stats.prospects.inserted++;
        } catch (error: any) {
          console.error(`  ❌ Erro ao inserir ${prospect.companyName}:`, error.message);
          stats.prospects.errors++;
        }
      }
      console.log('');
    }

    // =========================================================================
    // 4. MIGRAR CLIENTES
    // =========================================================================
    if (dbData.clients && dbData.clients.length > 0) {
      console.log('📋 Migrando CLIENTES...');
      stats.clients.total = dbData.clients.length;

      for (const client of dbData.clients) {
        try {
          // Verificar se já existe (por CNPJ ou email)
          const existing = await query(
            'SELECT id FROM clients WHERE cnpj = $1 OR email = $2',
            [client.cnpj, client.email]
          );

          if (existing.rows.length > 0) {
            console.log(`  ⏭️  Cliente já existe: ${client.name || client.companyName}`);
            stats.clients.skipped++;
            continue;
          }

          // Gerar ID único para o cliente
          const clientId = client.id || `migrated_client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          await query(
            `INSERT INTO clients (
              id, name, cnpj, email, phone, status, stage, temperature,
              total_lives, contract_end_date, partner_id,
              current_products, viability_score, potential_products,
              potential_products_with_values, custom_recommendations,
              last_updated, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              clientId,
              client.name || client.companyName,
              client.cnpj,
              client.email || null,
              client.phone || null,
              client.status || 'active',
              client.stage || 'prospeccao',
              client.temperature || 'cold',
              client.totalLives || client.total_lives || 0,
              client.contractEndDate || client.contract_end_date || null,
              client.partnerId?.toString() || null,
              JSON.stringify(client.currentProducts || client.current_products || []),
              client.viabilityScore || client.viability_score || 0,
              JSON.stringify(client.potentialProducts || client.potential_products || []),
              JSON.stringify(client.potentialProductsWithValues || client.potential_products_with_values || []),
              client.customRecommendations || client.custom_recommendations || '',
              client.lastUpdated || client.last_updated || new Date().toISOString(),
              `Migrado do db.json - Contato: ${client.contactName || 'N/A'}, Segmento: ${client.segment || 'N/A'}, Funcionários: ${client.employees || client.employeeCount || 'N/A'}`
            ]
          );

          console.log(`  ✅ Inserido: ${client.name || client.companyName}`);
          stats.clients.inserted++;
        } catch (error: any) {
          console.error(`  ❌ Erro ao inserir ${client.name || client.companyName}:`, error.message);
          stats.clients.errors++;
        }
      }
      console.log('');
    }

    // =========================================================================
    // 5. MIGRAR MATERIAIS DE SUPORTE
    // =========================================================================
    if (dbData.support_materials && dbData.support_materials.length > 0) {
      console.log('📋 Migrando MATERIAIS DE SUPORTE...');
      stats.support_materials.total = dbData.support_materials.length;

      for (const material of dbData.support_materials) {
        try {
          // Verificar se já existe (por título)
          const existing = await query(
            'SELECT id FROM support_materials WHERE title = $1',
            [material.title]
          );

          if (existing.rows.length > 0) {
            console.log(`  ⏭️  Material já existe: ${material.title}`);
            stats.support_materials.skipped++;
            continue;
          }

          await query(
            `INSERT INTO support_materials (
              id, title, category, type, description,
              download_url, view_url, file_size, duration,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              material.id || `migrated_${Date.now()}_${Math.random()}`,
              material.title,
              material.category,
              material.type,
              material.description,
              material.downloadUrl || material.download_url || null,
              material.viewUrl || material.view_url || null,
              material.fileSize || material.file_size || null,
              material.duration || null,
              material.createdAt || material.created_at || new Date().toISOString(),
              material.updatedAt || material.updated_at || new Date().toISOString()
            ]
          );

          console.log(`  ✅ Inserido: ${material.title}`);
          stats.support_materials.inserted++;
        } catch (error: any) {
          console.error(`  ❌ Erro ao inserir ${material.title}:`, error.message);
          stats.support_materials.errors++;
        }
      }
      console.log('');
    }

    // =========================================================================
    // RESUMO FINAL
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(70));

    for (const [table, stat] of Object.entries(stats)) {
      console.log(`\n${table.toUpperCase()}:`);
      console.log(`  Total no db.json: ${stat.total}`);
      console.log(`  ✅ Inseridos: ${stat.inserted}`);
      console.log(`  ⏭️  Já existiam: ${stat.skipped}`);
      console.log(`  ❌ Erros: ${stat.errors}`);
    }

    const totalInserted = Object.values(stats).reduce((sum, s) => sum + s.inserted, 0);
    const totalSkipped = Object.values(stats).reduce((sum, s) => sum + s.skipped, 0);
    const totalErrors = Object.values(stats).reduce((sum, s) => sum + s.errors, 0);

    console.log('\n' + '='.repeat(70));
    console.log(`🎉 MIGRAÇÃO CONCLUÍDA!`);
    console.log(`   Total inserido: ${totalInserted} registros`);
    console.log(`   Total ignorado: ${totalSkipped} registros (já existiam)`);
    console.log(`   Total de erros: ${totalErrors} registros`);
    console.log('='.repeat(70) + '\n');

  } catch (error: any) {
    console.error('\n❌ ERRO FATAL na migração:', error);
    process.exit(1);
  }
}

// Executar migração
migrateData()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  });

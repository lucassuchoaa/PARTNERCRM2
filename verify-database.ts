/**
 * Script de Verificação do Banco de Dados PostgreSQL
 *
 * Este script verifica o estado atual do banco, conta registros,
 * e identifica possíveis problemas de integridade.
 */

import { query } from './server/db';

interface TableStats {
  table_name: string;
  total_count: number;
  sample_data?: any[];
}

async function verifyDatabase() {
  console.log('=' .repeat(80));
  console.log('VERIFICACAO DO BANCO DE DADOS POSTGRESQL - PARTNERS CRM');
  console.log('=' .repeat(80));
  console.log(`Data/Hora: ${new Date().toISOString()}\n`);

  try {
    // =========================================================================
    // 1. INFORMACOES DO BANCO DE DADOS
    // =========================================================================
    console.log('\n1. INFORMACOES DO BANCO DE DADOS');
    console.log('-'.repeat(80));

    const dbVersion = await query('SELECT version()');
    console.log('Versao PostgreSQL:', dbVersion.rows[0].version);

    const dbName = await query('SELECT current_database()');
    console.log('Database Name:', dbName.rows[0].current_database);

    const dbSize = await query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    console.log('Database Size:', dbSize.rows[0].size);

    // =========================================================================
    // 2. LISTAR TODAS AS TABELAS
    // =========================================================================
    console.log('\n\n2. TABELAS NO BANCO DE DADOS');
    console.log('-'.repeat(80));

    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`Total de tabelas: ${tables.rows.length}\n`);
    tables.rows.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.table_name}`);
    });

    // =========================================================================
    // 3. CONTAGEM DE REGISTROS POR TABELA
    // =========================================================================
    console.log('\n\n3. CONTAGEM DE REGISTROS');
    console.log('-'.repeat(80));

    const tableStats: TableStats[] = [];

    for (const table of tables.rows) {
      const tableName = table.table_name;

      try {
        const count = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const total = parseInt(count.rows[0].count);

        tableStats.push({
          table_name: tableName,
          total_count: total
        });

        console.log(`${tableName.padEnd(30)} | ${total.toString().padStart(6)} registros`);
      } catch (error: any) {
        console.log(`${tableName.padEnd(30)} | ERRO: ${error.message}`);
      }
    }

    // =========================================================================
    // 4. ANALISE DETALHADA - USUARIOS
    // =========================================================================
    console.log('\n\n4. ANALISE DETALHADA - USUARIOS');
    console.log('-'.repeat(80));

    const usersExist = tables.rows.some(t => t.table_name === 'users');

    if (usersExist) {
      const users = await query(`
        SELECT id, email, name, role, status, created_at
        FROM users
        ORDER BY created_at DESC
      `);

      console.log(`Total de usuarios: ${users.rows.length}\n`);

      if (users.rows.length > 0) {
        console.log('Lista de usuarios:');
        users.rows.forEach((user, idx) => {
          console.log(`  ${idx + 1}. ${user.email.padEnd(30)} | ${user.role.padEnd(10)} | ${user.status}`);
        });

        // Contar por role
        const roleCount = await query(`
          SELECT role, COUNT(*) as count
          FROM users
          GROUP BY role
          ORDER BY count DESC
        `);

        console.log('\nDistribuicao por role:');
        roleCount.rows.forEach(r => {
          console.log(`  ${r.role.padEnd(15)}: ${r.count} usuarios`);
        });

        // Contar por status
        const statusCount = await query(`
          SELECT status, COUNT(*) as count
          FROM users
          GROUP BY status
          ORDER BY count DESC
        `);

        console.log('\nDistribuicao por status:');
        statusCount.rows.forEach(s => {
          console.log(`  ${s.status.padEnd(15)}: ${s.count} usuarios`);
        });
      } else {
        console.log('AVISO: Tabela users esta VAZIA!');
      }
    } else {
      console.log('AVISO: Tabela users NAO EXISTE!');
    }

    // =========================================================================
    // 5. ANALISE DETALHADA - PROSPECTS
    // =========================================================================
    console.log('\n\n5. ANALISE DETALHADA - PROSPECTS');
    console.log('-'.repeat(80));

    const prospectsExist = tables.rows.some(t => t.table_name === 'prospects');

    if (prospectsExist) {
      const prospects = await query(`
        SELECT id, company_name, cnpj, status, partner_id, submitted_at
        FROM prospects
        ORDER BY submitted_at DESC
      `);

      console.log(`Total de prospects: ${prospects.rows.length}\n`);

      if (prospects.rows.length > 0) {
        console.log('Ultimos 10 prospects:');
        prospects.rows.slice(0, 10).forEach((p, idx) => {
          console.log(`  ${idx + 1}. ${p.company_name?.padEnd(30) || 'N/A'.padEnd(30)} | ${p.cnpj || 'N/A'} | ${p.status}`);
        });

        // Contar por status
        const statusCount = await query(`
          SELECT status, COUNT(*) as count
          FROM prospects
          GROUP BY status
          ORDER BY count DESC
        `);

        console.log('\nDistribuicao por status:');
        statusCount.rows.forEach(s => {
          console.log(`  ${s.status.padEnd(15)}: ${s.count} prospects`);
        });

        // Verificar duplicados por CNPJ
        const duplicates = await query(`
          SELECT cnpj, COUNT(*) as count
          FROM prospects
          WHERE cnpj IS NOT NULL
          GROUP BY cnpj
          HAVING COUNT(*) > 1
        `);

        if (duplicates.rows.length > 0) {
          console.log('\nAVISO: CNPJs DUPLICADOS encontrados:');
          duplicates.rows.forEach(d => {
            console.log(`  CNPJ ${d.cnpj}: ${d.count} registros`);
          });
        } else {
          console.log('\nOK: Nenhum CNPJ duplicado encontrado');
        }
      } else {
        console.log('AVISO: Tabela prospects esta VAZIA!');
      }
    } else {
      console.log('AVISO: Tabela prospects NAO EXISTE!');
    }

    // =========================================================================
    // 6. ANALISE DETALHADA - CLIENTS
    // =========================================================================
    console.log('\n\n6. ANALISE DETALHADA - CLIENTS');
    console.log('-'.repeat(80));

    const clientsExist = tables.rows.some(t => t.table_name === 'clients');

    if (clientsExist) {
      const clients = await query(`
        SELECT id, name, cnpj, status, stage, temperature, partner_id
        FROM clients
        ORDER BY name
      `);

      console.log(`Total de clientes: ${clients.rows.length}\n`);

      if (clients.rows.length > 0) {
        console.log('Lista de clientes:');
        clients.rows.forEach((c, idx) => {
          console.log(`  ${idx + 1}. ${c.name?.padEnd(30) || 'N/A'.padEnd(30)} | ${c.status.padEnd(10)} | ${c.stage || 'N/A'}`);
        });

        // Contar por status
        const statusCount = await query(`
          SELECT status, COUNT(*) as count
          FROM clients
          GROUP BY status
          ORDER BY count DESC
        `);

        console.log('\nDistribuicao por status:');
        statusCount.rows.forEach(s => {
          console.log(`  ${s.status.padEnd(15)}: ${s.count} clientes`);
        });

        // Contar por stage
        const stageCount = await query(`
          SELECT stage, COUNT(*) as count
          FROM clients
          GROUP BY stage
          ORDER BY count DESC
        `);

        console.log('\nDistribuicao por stage:');
        stageCount.rows.forEach(s => {
          console.log(`  ${(s.stage || 'NULL').padEnd(15)}: ${s.count} clientes`);
        });

        // Verificar duplicados por CNPJ
        const duplicates = await query(`
          SELECT cnpj, COUNT(*) as count
          FROM clients
          WHERE cnpj IS NOT NULL
          GROUP BY cnpj
          HAVING COUNT(*) > 1
        `);

        if (duplicates.rows.length > 0) {
          console.log('\nAVISO: CNPJs DUPLICADOS encontrados:');
          duplicates.rows.forEach(d => {
            console.log(`  CNPJ ${d.cnpj}: ${d.count} registros`);
          });
        } else {
          console.log('\nOK: Nenhum CNPJ duplicado encontrado');
        }
      } else {
        console.log('AVISO: Tabela clients esta VAZIA!');
      }
    } else {
      console.log('AVISO: Tabela clients NAO EXISTE!');
    }

    // =========================================================================
    // 7. ANALISE DETALHADA - SUPPORT_MATERIALS
    // =========================================================================
    console.log('\n\n7. ANALISE DETALHADA - SUPPORT_MATERIALS');
    console.log('-'.repeat(80));

    const materialsExist = tables.rows.some(t => t.table_name === 'support_materials');

    if (materialsExist) {
      const materials = await query(`
        SELECT id, title, category, type, created_at
        FROM support_materials
        ORDER BY created_at DESC
      `);

      console.log(`Total de materiais: ${materials.rows.length}\n`);

      if (materials.rows.length > 0) {
        console.log('Lista de materiais:');
        materials.rows.forEach((m, idx) => {
          console.log(`  ${idx + 1}. ${m.title?.padEnd(40) || 'N/A'.padEnd(40)} | ${m.category || 'N/A'} | ${m.type || 'N/A'}`);
        });

        // Contar por categoria
        const categoryCount = await query(`
          SELECT category, COUNT(*) as count
          FROM support_materials
          GROUP BY category
          ORDER BY count DESC
        `);

        console.log('\nDistribuicao por categoria:');
        categoryCount.rows.forEach(c => {
          console.log(`  ${(c.category || 'NULL').padEnd(15)}: ${c.count} materiais`);
        });

        // Contar por tipo
        const typeCount = await query(`
          SELECT type, COUNT(*) as count
          FROM support_materials
          GROUP BY type
          ORDER BY count DESC
        `);

        console.log('\nDistribuicao por tipo:');
        typeCount.rows.forEach(t => {
          console.log(`  ${(t.type || 'NULL').padEnd(15)}: ${t.count} materiais`);
        });
      } else {
        console.log('AVISO: Tabela support_materials esta VAZIA!');
      }
    } else {
      console.log('AVISO: Tabela support_materials NAO EXISTE!');
    }

    // =========================================================================
    // 8. ANALISE DETALHADA - REMUNERATION_TABLES
    // =========================================================================
    console.log('\n\n8. ANALISE DETALHADA - REMUNERATION_TABLES');
    console.log('-'.repeat(80));

    const remunerationExist = tables.rows.some(t => t.table_name === 'remuneration_tables');

    if (remunerationExist) {
      const remuneration = await query(`
        SELECT id, employee_range_start, employee_range_end,
               finder_negotiation_margin, final_finder_cashback, created_at
        FROM remuneration_tables
        ORDER BY employee_range_start::int
      `);

      console.log(`Total de tabelas de remuneracao: ${remuneration.rows.length}\n`);

      if (remuneration.rows.length > 0) {
        console.log('Lista de tabelas:');
        remuneration.rows.forEach((r, idx) => {
          const range = `${r.employee_range_start}-${r.employee_range_end || '∞'}`;
          console.log(`  ${idx + 1}. Funcionarios: ${range.padEnd(15)} | Margem: ${r.finder_negotiation_margin || 'N/A'} | Cashback: ${r.final_finder_cashback || 'N/A'}`);
        });
      } else {
        console.log('AVISO: Tabela remuneration_tables esta VAZIA!');
      }
    } else {
      console.log('AVISO: Tabela remuneration_tables NAO EXISTE!');
    }

    // =========================================================================
    // 9. VERIFICACAO DE INTEGRIDADE REFERENCIAL
    // =========================================================================
    console.log('\n\n9. VERIFICACAO DE INTEGRIDADE REFERENCIAL');
    console.log('-'.repeat(80));

    // Verificar prospects sem partner_id valido
    if (prospectsExist && usersExist) {
      const orphanProspects = await query(`
        SELECT COUNT(*) as count
        FROM prospects p
        WHERE p.partner_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM users u WHERE u.id = p.partner_id::text
        )
      `);

      if (parseInt(orphanProspects.rows[0].count) > 0) {
        console.log(`AVISO: ${orphanProspects.rows[0].count} prospects com partner_id invalido`);
      } else {
        console.log('OK: Todos os prospects tem partner_id valido ou NULL');
      }
    }

    // Verificar clients sem partner_id valido
    if (clientsExist && usersExist) {
      const orphanClients = await query(`
        SELECT COUNT(*) as count
        FROM clients c
        WHERE c.partner_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM users u WHERE u.id = c.partner_id::text
        )
      `);

      if (parseInt(orphanClients.rows[0].count) > 0) {
        console.log(`AVISO: ${orphanClients.rows[0].count} clients com partner_id invalido`);
      } else {
        console.log('OK: Todos os clients tem partner_id valido ou NULL');
      }
    }

    // =========================================================================
    // 10. RESUMO FINAL
    // =========================================================================
    console.log('\n\n10. RESUMO FINAL');
    console.log('-'.repeat(80));

    const summary = tableStats.filter(t =>
      ['users', 'prospects', 'clients', 'support_materials', 'remuneration_tables'].includes(t.table_name)
    );

    console.log('\nTabelas Principais:');
    summary.forEach(s => {
      const status = s.total_count > 0 ? 'OK' : 'VAZIA';
      console.log(`  ${s.table_name.padEnd(25)}: ${s.total_count.toString().padStart(6)} registros [${status}]`);
    });

    const totalRecords = tableStats.reduce((sum, t) => sum + t.total_count, 0);
    console.log(`\nTotal de registros no banco: ${totalRecords}`);

    // =========================================================================
    // 11. COMPARACAO COM EXPECTATIVAS
    // =========================================================================
    console.log('\n\n11. COMPARACAO COM EXPECTATIVAS (db.json)');
    console.log('-'.repeat(80));

    const expectations = {
      users: { expected: 2, description: 'Admin + Parceiro Demo' },
      prospects: { expected: 8, description: 'Indicacoes de exemplo' },
      clients: { expected: 0, description: 'Inicialmente vazio' },
      support_materials: { expected: 8, description: 'Materiais de apoio' },
      remuneration_tables: { expected: 4, description: 'Tabelas de comissao' }
    };

    console.log('\nComparacao:');
    for (const [tableName, expectation] of Object.entries(expectations)) {
      const actual = tableStats.find(t => t.table_name === tableName);
      const count = actual?.total_count || 0;
      const status = count >= expectation.expected ? 'OK' : 'ATENCAO';

      console.log(`  ${tableName.padEnd(25)}: Esperado ${expectation.expected.toString().padStart(2)}, Atual ${count.toString().padStart(2)} [${status}] - ${expectation.description}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('VERIFICACAO CONCLUIDA!');
    console.log('='.repeat(80) + '\n');

  } catch (error: any) {
    console.error('\n\nERRO FATAL na verificacao:', error);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar verificacao
verifyDatabase()
  .then(() => {
    console.log('Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar verificacao:', error);
    process.exit(1);
  });

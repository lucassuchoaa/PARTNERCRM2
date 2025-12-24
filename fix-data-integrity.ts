/**
 * Script de Correção de Integridade de Dados
 *
 * Este script corrige os problemas identificados:
 * 1. Prospects com partner_id inválido
 * 2. Adiciona tabelas de remuneração faltantes
 */

import { query } from './server/db';

async function fixDataIntegrity() {
  console.log('=' .repeat(80));
  console.log('CORRECAO DE INTEGRIDADE DE DADOS');
  console.log('=' .repeat(80));
  console.log(`Data/Hora: ${new Date().toISOString()}\n`);

  try {
    // =========================================================================
    // 1. CORRIGIR PROSPECTS COM PARTNER_ID INVALIDO
    // =========================================================================
    console.log('1. CORRIGINDO PROSPECTS COM PARTNER_ID INVALIDO\n');

    // Verificar prospects com problema
    const invalidProspects = await query(`
      SELECT p.id, p.company_name, p.cnpj, p.partner_id, p.status
      FROM prospects p
      WHERE p.partner_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = p.partner_id::text
      )
    `);

    console.log(`Encontrados ${invalidProspects.rows.length} prospects com partner_id invalido\n`);

    if (invalidProspects.rows.length > 0) {
      console.log('Opcoes de correcao:');
      console.log('  A) Definir partner_id como NULL (indicacao orfa)');
      console.log('  B) Atribuir ao usuario admin principal (ID: 1)');
      console.log('\nEscolhendo opcao B por padrao...\n');

      for (const prospect of invalidProspects.rows) {
        console.log(`Corrigindo prospect: ${prospect.company_name} (${prospect.cnpj})`);
        console.log(`  Partner ID invalido: ${prospect.partner_id}`);
        console.log(`  Novo Partner ID: 1 (admin@somapay.com.br)`);

        await query(
          'UPDATE prospects SET partner_id = $1 WHERE id = $2',
          ['1', prospect.id]
        );

        console.log(`  OK - Atualizado!\n`);
      }

      console.log(`Total de prospects corrigidos: ${invalidProspects.rows.length}\n`);
    } else {
      console.log('Nenhum prospect precisa de correcao.\n');
    }

    // =========================================================================
    // 2. ADICIONAR TABELAS DE REMUNERACAO FALTANTES
    // =========================================================================
    console.log('\n2. ADICIONANDO TABELAS DE REMUNERACAO FALTANTES\n');

    // Verificar quantas tabelas existem
    const currentTables = await query('SELECT COUNT(*) as count FROM remuneration_tables');
    const count = parseInt(currentTables.rows[0].count);

    console.log(`Tabelas de remuneracao atuais: ${count}`);
    console.log(`Tabelas esperadas: 4\n`);

    if (count < 4) {
      console.log('Inserindo tabelas faltantes...\n');

      const tablesToInsert = [
        {
          employee_range_start: '1',
          employee_range_end: '10',
          finder_negotiation_margin: '5',
          max_company_cashback: '10',
          final_finder_cashback: '15',
          description: 'Micro empresas (1-10 funcionarios)',
          value_type: 'percentage'
        },
        {
          employee_range_start: '11',
          employee_range_end: '50',
          finder_negotiation_margin: '7',
          max_company_cashback: '12',
          final_finder_cashback: '19',
          description: 'Pequenas empresas (11-50 funcionarios)',
          value_type: 'percentage'
        },
        {
          employee_range_start: '51',
          employee_range_end: '200',
          finder_negotiation_margin: '10',
          max_company_cashback: '15',
          final_finder_cashback: '25',
          description: 'Medias empresas (51-200 funcionarios)',
          value_type: 'percentage'
        },
        {
          employee_range_start: '201',
          employee_range_end: null,
          finder_negotiation_margin: '12',
          max_company_cashback: '18',
          final_finder_cashback: '30',
          description: 'Grandes empresas (201+ funcionarios)',
          value_type: 'percentage'
        }
      ];

      for (const table of tablesToInsert) {
        // Verificar se já existe
        const existing = await query(
          'SELECT id FROM remuneration_tables WHERE employee_range_start = $1',
          [table.employee_range_start]
        );

        if (existing.rows.length > 0) {
          console.log(`  Tabela ja existe: ${table.description}`);
          continue;
        }

        // Inserir
        await query(
          `INSERT INTO remuneration_tables (
            employee_range_start, employee_range_end,
            finder_negotiation_margin, max_company_cashback,
            final_finder_cashback, description, value_type, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            table.employee_range_start,
            table.employee_range_end,
            table.finder_negotiation_margin,
            table.max_company_cashback,
            table.final_finder_cashback,
            table.description,
            table.value_type,
            new Date().toISOString()
          ]
        );

        console.log(`  OK - Inserida: ${table.description}`);
      }

      console.log('\nTabelas de remuneracao atualizadas!\n');
    } else {
      console.log('Todas as tabelas de remuneracao ja existem.\n');
    }

    // =========================================================================
    // 3. VERIFICACAO FINAL
    // =========================================================================
    console.log('\n3. VERIFICACAO FINAL\n');

    // Verificar prospects
    const stillInvalid = await query(`
      SELECT COUNT(*) as count
      FROM prospects p
      WHERE p.partner_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = p.partner_id::text
      )
    `);

    console.log(`Prospects com partner_id invalido: ${stillInvalid.rows[0].count}`);

    // Verificar tabelas de remuneracao
    const finalCount = await query('SELECT COUNT(*) as count FROM remuneration_tables');
    console.log(`Tabelas de remuneracao: ${finalCount.rows[0].count}`);

    console.log('\n' + '='.repeat(80));
    console.log('CORRECAO CONCLUIDA!');
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\nERRO FATAL na correcao:', error);
    console.error('Mensagem:', error.message);
    process.exit(1);
  }
}

// Executar correcao
fixDataIntegrity();

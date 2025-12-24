/**
 * Script de Auditoria Completa do Banco de Dados
 *
 * Executa todas as verificações e gera relatório consolidado
 */

import { query } from './server/db';
import * as fs from 'fs';
import * as path from 'path';

interface AuditReport {
  audit_metadata: {
    timestamp: string;
    database: string;
    postgres_version: string;
  };
  summary: {
    total_tables: number;
    total_records: number;
    total_issues: number;
    critical_issues: number;
    warnings: number;
  };
  tables: any;
  issues: any[];
  recommendations: string[];
}

async function runFullAudit() {
  console.log('=' .repeat(80));
  console.log('AUDITORIA COMPLETA DO BANCO DE DADOS');
  console.log('=' .repeat(80));
  const timestamp = new Date().toISOString();
  console.log(`Data/Hora: ${timestamp}\n`);

  const report: AuditReport = {
    audit_metadata: {
      timestamp,
      database: '',
      postgres_version: ''
    },
    summary: {
      total_tables: 0,
      total_records: 0,
      total_issues: 0,
      critical_issues: 0,
      warnings: 0
    },
    tables: {},
    issues: [],
    recommendations: []
  };

  try {
    // =========================================================================
    // 1. INFORMACOES BASICAS
    // =========================================================================
    console.log('1. COLETANDO INFORMACOES BASICAS...\n');

    const version = await query('SELECT version()');
    report.audit_metadata.postgres_version = version.rows[0].version;

    const dbName = await query('SELECT current_database()');
    report.audit_metadata.database = dbName.rows[0].current_database;

    console.log(`Database: ${report.audit_metadata.database}`);
    console.log(`PostgreSQL: ${report.audit_metadata.postgres_version.split(',')[0]}\n`);

    // =========================================================================
    // 2. CONTAGEM DE TABELAS E REGISTROS
    // =========================================================================
    console.log('2. CONTANDO REGISTROS...\n');

    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    report.summary.total_tables = tables.rows.length;

    for (const table of tables.rows) {
      const tableName = table.table_name;
      const count = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const total = parseInt(count.rows[0].count);

      report.tables[tableName] = { count: total };
      report.summary.total_records += total;

      console.log(`  ${tableName.padEnd(30)}: ${total.toString().padStart(6)} registros`);
    }

    console.log(`\nTotal: ${report.summary.total_records} registros em ${report.summary.total_tables} tabelas\n`);

    // =========================================================================
    // 3. VERIFICACAO DE INTEGRIDADE
    // =========================================================================
    console.log('3. VERIFICANDO INTEGRIDADE...\n');

    // 3.1. Prospects com partner_id invalido
    const invalidProspects = await query(`
      SELECT COUNT(*) as count
      FROM prospects p
      WHERE p.partner_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = p.partner_id::text
      )
    `);

    const invalidProspectsCount = parseInt(invalidProspects.rows[0].count);
    if (invalidProspectsCount > 0) {
      report.issues.push({
        id: 'INT-001',
        severity: 'WARNING',
        table: 'prospects',
        description: `${invalidProspectsCount} prospects com partner_id invalido`,
        fix_script: 'fix-data-integrity.ts'
      });
      report.summary.warnings++;
      console.log(`  WARNING: ${invalidProspectsCount} prospects com partner_id invalido`);
    } else {
      console.log('  OK: Todos os prospects tem partner_id valido');
    }

    // 3.2. Clients com partner_id invalido
    const invalidClients = await query(`
      SELECT COUNT(*) as count
      FROM clients c
      WHERE c.partner_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = c.partner_id::text
      )
    `);

    const invalidClientsCount = parseInt(invalidClients.rows[0].count);
    if (invalidClientsCount > 0) {
      report.issues.push({
        id: 'INT-002',
        severity: 'WARNING',
        table: 'clients',
        description: `${invalidClientsCount} clients com partner_id invalido`,
        fix_script: 'fix-data-integrity.ts'
      });
      report.summary.warnings++;
      console.log(`  WARNING: ${invalidClientsCount} clients com partner_id invalido`);
    } else {
      console.log('  OK: Todos os clients tem partner_id valido');
    }

    // 3.3. CNPJs duplicados em prospects
    const duplicateProspectsCnpj = await query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT cnpj
        FROM prospects
        WHERE cnpj IS NOT NULL
        GROUP BY cnpj
        HAVING COUNT(*) > 1
      ) as duplicates
    `);

    const duplicateProspectsCount = parseInt(duplicateProspectsCnpj.rows[0].count);
    if (duplicateProspectsCount > 0) {
      report.issues.push({
        id: 'DUP-001',
        severity: 'WARNING',
        table: 'prospects',
        description: `${duplicateProspectsCount} CNPJs duplicados em prospects`
      });
      report.summary.warnings++;
      console.log(`  WARNING: ${duplicateProspectsCount} CNPJs duplicados em prospects`);
    } else {
      console.log('  OK: Nenhum CNPJ duplicado em prospects');
    }

    // 3.4. CNPJs duplicados em clients
    const duplicateClientsCnpj = await query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT cnpj
        FROM clients
        WHERE cnpj IS NOT NULL
        GROUP BY cnpj
        HAVING COUNT(*) > 1
      ) as duplicates
    `);

    const duplicateClientsCount = parseInt(duplicateClientsCnpj.rows[0].count);
    if (duplicateClientsCount > 0) {
      report.issues.push({
        id: 'DUP-002',
        severity: 'WARNING',
        table: 'clients',
        description: `${duplicateClientsCount} CNPJs duplicados em clients`
      });
      report.summary.warnings++;
      console.log(`  WARNING: ${duplicateClientsCount} CNPJs duplicados em clients`);
    } else {
      console.log('  OK: Nenhum CNPJ duplicado em clients');
    }

    // 3.5. Tabelas de remuneracao
    const remunerationCount = await query('SELECT COUNT(*) as count FROM remuneration_tables');
    const remunerationTotal = parseInt(remunerationCount.rows[0].count);

    if (remunerationTotal < 4) {
      report.issues.push({
        id: 'DATA-001',
        severity: 'WARNING',
        table: 'remuneration_tables',
        description: `Apenas ${remunerationTotal} de 4 tabelas de remuneracao esperadas`,
        fix_script: 'fix-data-integrity.ts'
      });
      report.summary.warnings++;
      console.log(`  WARNING: Apenas ${remunerationTotal} de 4 tabelas de remuneracao`);
    } else {
      console.log('  OK: Todas as tabelas de remuneracao existem');
    }

    console.log('');

    // =========================================================================
    // 4. RECOMENDACOES
    // =========================================================================
    console.log('4. GERANDO RECOMENDACOES...\n');

    if (report.summary.warnings > 0 || report.summary.critical_issues > 0) {
      report.recommendations.push('Executar backup imediatamente: tsx backup-database.ts');
      report.recommendations.push('Corrigir problemas identificados: tsx fix-data-integrity.ts');
      report.recommendations.push('Validar correcoes: tsx verify-database.ts');
    } else {
      report.recommendations.push('Configurar backups automaticos semanais');
      report.recommendations.push('Implementar monitoramento continuo');
    }

    report.summary.total_issues = report.issues.length;

    // =========================================================================
    // 5. SALVAR RELATORIO
    // =========================================================================
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = path.join(
      reportsDir,
      `audit-${timestamp.replace(/:/g, '-').split('.')[0]}.json`
    );

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');

    // =========================================================================
    // 6. RESUMO FINAL
    // =========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('RESUMO DA AUDITORIA');
    console.log('='.repeat(80));
    console.log(`\nTabelas: ${report.summary.total_tables}`);
    console.log(`Registros: ${report.summary.total_records}`);
    console.log(`\nProblemas Criticos: ${report.summary.critical_issues}`);
    console.log(`Avisos: ${report.summary.warnings}`);
    console.log(`Total de Issues: ${report.summary.total_issues}`);

    if (report.issues.length > 0) {
      console.log('\nIssues Identificados:');
      report.issues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. [${issue.severity}] ${issue.description}`);
        if (issue.fix_script) {
          console.log(`     Fix: tsx ${issue.fix_script}`);
        }
      });
    }

    console.log('\nRecomendacoes:');
    report.recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });

    console.log(`\nRelatorio salvo em: ${reportFile}`);
    console.log('='.repeat(80) + '\n');

    process.exit(report.summary.critical_issues > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\nERRO FATAL na auditoria:', error);
    console.error('Mensagem:', error.message);
    process.exit(1);
  }
}

// Executar auditoria
runFullAudit();

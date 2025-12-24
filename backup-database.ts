/**
 * Script de Backup do Banco de Dados PostgreSQL
 *
 * Cria um backup completo de todas as tabelas em formato JSON
 * para facilitar restauracao e migracao.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { query } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BackupData {
  metadata: {
    backup_date: string;
    database_name: string;
    total_tables: number;
    total_records: number;
  };
  tables: {
    [key: string]: any[];
  };
}

async function backupDatabase() {
  console.log('=' .repeat(80));
  console.log('BACKUP DO BANCO DE DADOS POSTGRESQL');
  console.log('=' .repeat(80));
  console.log(`Data/Hora: ${new Date().toISOString()}\n`);

  try {
    const backup: BackupData = {
      metadata: {
        backup_date: new Date().toISOString(),
        database_name: '',
        total_tables: 0,
        total_records: 0
      },
      tables: {}
    };

    // Obter nome do banco
    const dbName = await query('SELECT current_database()');
    backup.metadata.database_name = dbName.rows[0].current_database;

    // Listar todas as tabelas
    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    backup.metadata.total_tables = tables.rows.length;
    console.log(`Encontradas ${tables.rows.length} tabelas para backup\n`);

    // Fazer backup de cada tabela
    for (const table of tables.rows) {
      const tableName = table.table_name;
      console.log(`Fazendo backup da tabela: ${tableName}...`);

      try {
        const data = await query(`SELECT * FROM ${tableName}`);
        backup.tables[tableName] = data.rows;
        backup.metadata.total_records += data.rows.length;
        console.log(`  OK - ${data.rows.length} registros`);
      } catch (error: any) {
        console.error(`  ERRO ao fazer backup de ${tableName}:`, error.message);
        backup.tables[tableName] = [];
      }
    }

    // Salvar backup em arquivo
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupDir = path.join(__dirname, 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(80));
    console.log('BACKUP CONCLUIDO COM SUCESSO!');
    console.log('='.repeat(80));
    console.log(`Arquivo: ${backupFile}`);
    console.log(`Total de tabelas: ${backup.metadata.total_tables}`);
    console.log(`Total de registros: ${backup.metadata.total_records}`);
    console.log('='.repeat(80) + '\n');

    // Criar também um backup das tabelas principais em formato separado
    const mainTablesBackup = {
      backup_date: backup.metadata.backup_date,
      users: backup.tables.users || [],
      prospects: backup.tables.prospects || [],
      clients: backup.tables.clients || [],
      support_materials: backup.tables.support_materials || [],
      remuneration_tables: backup.tables.remuneration_tables || []
    };

    const mainBackupFile = path.join(backupDir, `backup-main-tables-${timestamp}.json`);
    fs.writeFileSync(mainBackupFile, JSON.stringify(mainTablesBackup, null, 2), 'utf-8');
    console.log(`Backup das tabelas principais salvo em: ${mainBackupFile}\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('\nERRO FATAL no backup:', error);
    console.error('Mensagem:', error.message);
    process.exit(1);
  }
}

// Executar backup
backupDatabase();

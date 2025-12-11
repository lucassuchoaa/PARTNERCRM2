
import 'dotenv/config';
import { query } from './db.js';
import { execSync } from 'child_process';

async function initProduction() {
  console.log('🔍 Verificando se precisa executar seed...');

  try {
    // Verifica se o usuário admin existe
    const result = await query('SELECT id FROM users WHERE email = $1', ['admin@teste.com']);

    if (result.rows.length === 0) {
      console.log('📦 Executando seed inicial...');
      execSync('npm run seed', { stdio: 'inherit' });
      console.log('✅ Seed executado com sucesso!');
    } else {
      console.log('ℹ️  Seed já foi executado anteriormente');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/executar seed:', error);
  }
}

initProduction();

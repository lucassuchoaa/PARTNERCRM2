import bcrypt from 'bcrypt';
import { query } from './server/db.js';

async function updatePassword() {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  await query(
    'UPDATE users SET password = $1 WHERE email = $2',
    [hashedPassword, 'lucasuchoa@hotmail.com']
  );

  console.log('✅ Senha atualizada com sucesso!');
  console.log('Email: lucasuchoa@hotmail.com');
  console.log('Senha: admin123');
  process.exit(0);
}

updatePassword().catch(console.error);

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { query } from './db.js';
import crypto from 'crypto';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // 1. Criar usuário admin
    console.log('👤 Criando usuário admin...');
    const adminEmail = 'admin@teste.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      await query(
        `INSERT INTO users (id, email, name, password, role, status, permissions)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [
          crypto.randomUUID(),
          adminEmail,
          'Administrador',
          hashedPassword,
          'admin',
          'active',
          JSON.stringify({ all: true })
        ]
      );
      console.log('✅ Usuário admin criado');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminPassword}`);
    } else {
      console.log('ℹ️  Usuário admin já existe');
    }

    // 2. Criar planos de preço
    console.log('\n💰 Criando planos de preço...');

    const plans = [
      {
        id: crypto.randomUUID(),
        name: 'Starter',
        description: 'Ideal para pequenas equipes começando',
        base_price: 299.90,
        billing_type: 'monthly',
        included_users: 5,
        additional_user_price: 49.90,
        features: JSON.stringify([
          'Até 5 usuários',
          'CRM básico',
          'Relatórios mensais',
          'Suporte por email'
        ]),
        is_active: true,
        order: 1
      },
      {
        id: crypto.randomUUID(),
        name: 'Professional',
        description: 'Para equipes em crescimento',
        base_price: 599.90,
        billing_type: 'monthly',
        included_users: 15,
        additional_user_price: 39.90,
        features: JSON.stringify([
          'Até 15 usuários',
          'CRM completo',
          'Relatórios semanais',
          'Suporte prioritário',
          'Integrações HubSpot'
        ]),
        is_active: true,
        order: 2
      },
      {
        id: crypto.randomUUID(),
        name: 'Enterprise',
        description: 'Solução completa para grandes empresas',
        base_price: 1299.90,
        billing_type: 'monthly',
        included_users: 50,
        additional_user_price: 29.90,
        features: JSON.stringify([
          'Até 50 usuários',
          'CRM Enterprise',
          'Relatórios personalizados',
          'Suporte 24/7',
          'Todas as integrações',
          'ChatBot IA personalizado'
        ]),
        is_active: true,
        order: 3
      }
    ];

    for (const plan of plans) {
      const existing = await query('SELECT id FROM pricing_plans WHERE name = $1', [plan.name]);

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO pricing_plans (
            id, name, description, base_price, billing_type,
            included_users, additional_user_price, features, is_active, "order"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            plan.id,
            plan.name,
            plan.description,
            plan.base_price,
            plan.billing_type,
            plan.included_users,
            plan.additional_user_price,
            plan.features,
            plan.is_active,
            plan.order
          ]
        );
        console.log(`✅ Plano "${plan.name}" criado`);
      } else {
        console.log(`ℹ️  Plano "${plan.name}" já existe`);
      }
    }

    // 3. Criar produtos exemplo
    console.log('\n📦 Criando produtos exemplo...');

    const products = [
      {
        id: crypto.randomUUID(),
        name: 'Produto A',
        description: 'Produto exemplo A',
        price: 100.00,
        category: 'Categoria 1',
        is_active: true,
        order: 1
      },
      {
        id: crypto.randomUUID(),
        name: 'Produto B',
        description: 'Produto exemplo B',
        price: 200.00,
        category: 'Categoria 2',
        is_active: true,
        order: 2
      },
      {
        id: crypto.randomUUID(),
        name: 'Produto C',
        description: 'Produto exemplo C',
        price: 300.00,
        category: 'Categoria 3',
        is_active: true,
        order: 3
      }
    ];

    for (const product of products) {
      const existing = await query('SELECT id FROM products WHERE name = $1', [product.name]);

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO products (id, name, description, price, category, is_active, "order")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            product.id,
            product.name,
            product.description,
            product.price,
            product.category,
            product.is_active,
            product.order
          ]
        );
        console.log(`✅ Produto "${product.name}" criado`);
      } else {
        console.log(`ℹ️  Produto "${product.name}" já existe`);
      }
    }

    // Criar usuários de exemplo com senha "password123"
    const hashedPasswordForExampleUsers = await bcrypt.hash('password123', 10);

    console.log('[SEED] Creating users with hashed password');

    // Criar os 3 usuários com senha hasheada
    const adminPerms = JSON.stringify({ all: true });
    const partnerPerms = JSON.stringify({});

    await query(`
      INSERT INTO users (id, email, name, role, password, status, permissions)
      VALUES 
        ($1, 'admin@teste.com', 'Administrador', 'admin', $2, 'active', $3::jsonb),
        ($4, 'admin@partnerscrm.com', 'Admin User', 'admin', $2, 'active', $3::jsonb),
        ($5, 'partner@example.com', 'Partner User', 'partner', $2, 'active', $6::jsonb)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        status = EXCLUDED.status,
        permissions = EXCLUDED.permissions
    `, [
      crypto.randomUUID(),
      hashedPasswordForExampleUsers,
      adminPerms,
      crypto.randomUUID(),
      crypto.randomUUID(),
      partnerPerms
    ]);

    console.log('[SEED] Users created/updated successfully');
    console.log('[SEED] Passwords are hashed with bcrypt');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log(`   Email: admin@teste.com`);
    console.log(`   Senha: admin123`);
    console.log(`   Email: admin@partnerscrm.com`);
    console.log(`   Senha: password123`);
    console.log(`   Email: partner@example.com`);
    console.log(`   Senha: password123`);


    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

seed();
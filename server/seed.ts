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

    // 3. Criar produtos exemplo - DESABILITADO temporariamente devido a erro na estrutura da tabela
    // console.log('\n📦 Criando produtos exemplo...');
    console.log('\n📦 Pulando criação de produtos (tabela precisa de ajustes)...');

    // Criar usuários de exemplo com senha "password123"
    const hashedPasswordForExampleUsers = await bcrypt.hash('password123', 10);

    console.log('[SEED] Creating users with hashed password');

    // Criar os 3 usuários com senha hasheada
    const adminPerms = ['all'];
    const partnerPerms: string[] = [];

    await query(`
      INSERT INTO users (id, email, name, role, password, status, permissions)
      VALUES
        ($1, 'admin@teste.com', 'Administrador', 'admin', $2, 'active', $3),
        ($4, 'admin@partnerscrm.com', 'Admin User', 'admin', $2, 'active', $3),
        ($5, 'partner@example.com', 'Partner User', 'partner', $2, 'active', $6)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        status = EXCLUDED.status,
        role = EXCLUDED.role,
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

    // 4. Criar clientes de exemplo
    console.log('\n🏢 Criando clientes de exemplo...');

    const clients = [
      {
        id: crypto.randomUUID(),
        name: 'Tech Solutions Ltda',
        email: 'contato@techsolutions.com.br',
        phone: '11987654321',
        cnpj: '12345678000190',
        status: 'active',
        stage: 'client',
        temperature: 'hot',
        total_lives: 250,
        current_products: JSON.stringify(['Folha de Pagamento']),
        potential_products: JSON.stringify(['Consignado', 'Benefícios']),
        viability_score: 85,
        custom_recommendations: 'Cliente com alto potencial para expansão de produtos. Empresa em crescimento acelerado.',
        potential_products_with_values: JSON.stringify([
          { product: 'Consignado', totalLives: 180 },
          { product: 'Benefícios', benefitDetails: { vt: 150, vr: 200, premiacao: 100, gestaoCorporativa: 50 } }
        ])
      },
      {
        id: crypto.randomUUID(),
        name: 'Indústria Moderna S.A.',
        email: 'vendas@industriamoderna.com.br',
        phone: '11976543210',
        cnpj: '98765432000165',
        status: 'active',
        stage: 'client',
        temperature: 'warm',
        total_lives: 450,
        current_products: JSON.stringify(['Folha de Pagamento', 'Benefícios']),
        potential_products: JSON.stringify(['Consignado']),
        viability_score: 75,
        custom_recommendations: 'Grande empresa com boa estrutura. Potencial para consignado devido ao alto número de funcionários.',
        potential_products_with_values: JSON.stringify([
          { product: 'Consignado', totalLives: 400 }
        ])
      },
      {
        id: crypto.randomUUID(),
        name: 'Saúde Prime Clínicas',
        email: 'administrativo@saudeprime.com.br',
        phone: '11965432109',
        cnpj: '45678912000123',
        status: 'active',
        stage: 'client',
        temperature: 'hot',
        total_lives: 180,
        current_products: JSON.stringify(['Folha de Pagamento']),
        potential_products: JSON.stringify(['Benefícios', 'Consignado']),
        viability_score: 90,
        custom_recommendations: 'Excelente oportunidade de cross-sell. Gestores demonstraram interesse em produtos complementares.',
        potential_products_with_values: JSON.stringify([
          { product: 'Benefícios', benefitDetails: { vt: 100, vr: 150, premiacao: 80, gestaoCorporativa: 30 } },
          { product: 'Consignado', totalLives: 150 }
        ])
      },
      {
        id: crypto.randomUUID(),
        name: 'Comércio Brasil Distribuidora',
        email: 'financeiro@comerciobrasil.com.br',
        phone: '11954321098',
        cnpj: '78945612000145',
        status: 'active',
        stage: 'client',
        temperature: 'cold',
        total_lives: 80,
        current_products: JSON.stringify(['Folha de Pagamento']),
        potential_products: JSON.stringify(['Benefícios']),
        viability_score: 55,
        custom_recommendations: 'Empresa menor, focar no relacionamento antes de oferecer novos produtos.',
        potential_products_with_values: JSON.stringify([
          { product: 'Benefícios', benefitDetails: { vt: 60, vr: 70, premiacao: 30, gestaoCorporativa: 10 } }
        ])
      },
      {
        id: crypto.randomUUID(),
        name: 'Consultoria Estratégica Plus',
        email: 'rh@consultoriaplus.com.br',
        phone: '11943210987',
        cnpj: '32165498000178',
        status: 'active',
        stage: 'client',
        temperature: 'warm',
        total_lives: 120,
        current_products: JSON.stringify(['Folha de Pagamento', 'Consignado']),
        potential_products: JSON.stringify(['Benefícios']),
        viability_score: 70,
        custom_recommendations: 'Empresa em estágio de expansão. Boa oportunidade para pacote completo de benefícios.',
        potential_products_with_values: JSON.stringify([
          { product: 'Benefícios', benefitDetails: { vt: 80, vr: 100, premiacao: 60, gestaoCorporativa: 20 } }
        ])
      }
    ];

    for (const client of clients) {
      const existing = await query('SELECT id FROM clients WHERE cnpj = $1', [client.cnpj]);

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO clients (
            id, name, email, phone, cnpj, status, stage, temperature,
            total_lives, current_products, potential_products,
            viability_score, custom_recommendations, potential_products_with_values
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13, $14::jsonb)`,
          [
            client.id,
            client.name,
            client.email,
            client.phone,
            client.cnpj,
            client.status,
            client.stage,
            client.temperature,
            client.total_lives,
            client.current_products,
            client.potential_products,
            client.viability_score,
            client.custom_recommendations,
            client.potential_products_with_values
          ]
        );
        console.log(`✅ Cliente "${client.name}" criado`);
      } else {
        console.log(`ℹ️  Cliente "${client.name}" já existe`);
      }
    }

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
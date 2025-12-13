import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';

const router = express.Router();

// Rota para criar/migrar tabela de roles
router.get('/setup-roles', async (req, res) => {
  try {
    console.log('🔧 Criando tabela de roles...');

    // Criar tabela de roles se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        permissions JSONB DEFAULT '[]'::jsonb,
        is_system BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Verificar se já existem roles
    const existingRoles = await query('SELECT COUNT(*) FROM roles');

    if (parseInt(existingRoles.rows[0].count) === 0) {
      // Criar roles padrão do sistema
      const defaultRoles = [
        {
          name: 'Admin',
          description: 'Administrador com acesso total ao sistema',
          permissions: JSON.stringify([
            'dashboard.view', 'dashboard.analytics',
            'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
            'referrals.view', 'referrals.create', 'referrals.validate', 'referrals.approve',
            'reports.view', 'reports.export', 'reports.all_partners',
            'support.view', 'support.manage',
            'admin.access', 'admin.users', 'admin.roles', 'admin.products', 'admin.pricing', 'admin.notifications', 'admin.integrations', 'admin.files',
            'commissions.view', 'commissions.manage',
            'chatbot.view', 'chatbot.train'
          ]),
          is_system: true
        },
        {
          name: 'Parceiro',
          description: 'Parceiro comercial com acesso básico',
          permissions: JSON.stringify([
            'dashboard.view',
            'clients.view', 'clients.create', 'clients.edit',
            'referrals.view', 'referrals.create',
            'reports.view',
            'support.view',
            'commissions.view'
          ]),
          is_system: true
        },
        {
          name: 'Gerente de Parceiros',
          description: 'Gerente responsável por acompanhar parceiros',
          permissions: JSON.stringify([
            'dashboard.view', 'dashboard.analytics',
            'clients.view', 'clients.create', 'clients.edit',
            'referrals.view', 'referrals.create', 'referrals.validate',
            'reports.view', 'reports.export', 'reports.all_partners',
            'support.view',
            'commissions.view'
          ]),
          is_system: true
        },
        {
          name: 'Analista',
          description: 'Analista com acesso a relatórios e validação',
          permissions: JSON.stringify([
            'dashboard.view', 'dashboard.analytics',
            'clients.view',
            'referrals.view', 'referrals.validate',
            'reports.view', 'reports.export',
            'support.view',
            'commissions.view'
          ]),
          is_system: true
        }
      ];

      for (const role of defaultRoles) {
        await query(
          `INSERT INTO roles (name, description, permissions, is_system, is_active)
           VALUES ($1, $2, $3, $4, true)`,
          [role.name, role.description, role.permissions, role.is_system]
        );
      }

      console.log('✅ Roles padrão criadas com sucesso');
    }

    res.json({
      success: true,
      message: 'Tabela de roles criada/atualizada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar tabela de roles:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET para facilitar acesso via navegador
router.get('/setup', async (req, res) => {
  try {
    console.log('🌱 Inicializando banco de dados...');
    
    // Verificar se já foi inicializado
    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', ['admin@teste.com']);
    
    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Banco já foi inicializado. Usuário admin já existe.'
      });
    }

    // 1. Criar usuário admin
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await query(
      `INSERT INTO users (id, email, name, password, role, status, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        'admin@teste.com',
        'Administrador',
        hashedPassword,
        'admin',
        'active',
        JSON.stringify({ all: true })
      ]
    );

    // 2. Criar planos de preço
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
    }

    // 3. Criar produtos exemplo
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
    }

    res.json({
      success: true,
      message: 'Banco inicializado com sucesso!',
      credentials: {
        email: 'admin@teste.com',
        password: 'admin123'
      }
    });
  } catch (error: any) {
    console.error('Erro ao inicializar banco:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota para inicializar banco de dados em produção
// Apenas executar UMA VEZ após o primeiro deploy
router.post('/setup', async (req, res) => {
  try {
    console.log('🌱 Inicializando banco de dados...');
    
    // Verificar se já foi inicializado
    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', ['admin@teste.com']);
    
    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Banco já foi inicializado. Usuário admin já existe.'
      });
    }

    // 1. Criar usuário admin
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await query(
      `INSERT INTO users (id, email, name, password, role, status, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        'admin@teste.com',
        'Administrador',
        hashedPassword,
        'admin',
        'active',
        JSON.stringify({ all: true })
      ]
    );

    // 2. Criar planos de preço
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
    }

    // 3. Criar produtos exemplo
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
    }

    res.json({
      success: true,
      message: 'Banco inicializado com sucesso!',
      credentials: {
        email: 'admin@teste.com',
        password: 'admin123'
      }
    });
  } catch (error: any) {
    console.error('Erro ao inicializar banco:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

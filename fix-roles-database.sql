-- Script para garantir que as roles padrão existem no banco de dados

-- Deletar roles padrão se existirem (para recriar do zero)
DELETE FROM roles WHERE id IN ('role_admin', 'role_manager', 'role_partner');

-- Inserir role de Administrador
INSERT INTO roles (id, name, description, permissions, is_system, is_active, created_at, updated_at)
VALUES (
  'role_admin',
  'Administrador',
  'Acesso total ao sistema com todas as permissões',
  '["dashboard.view","dashboard.analytics","clients.view","clients.create","clients.edit","clients.delete","referrals.view","referrals.create","referrals.validate","referrals.approve","reports.view","reports.export","reports.all_partners","support.view","support.manage","admin.access","admin.users","admin.roles","admin.products","admin.pricing","admin.notifications","admin.integrations","admin.files","commissions.view","commissions.manage","chatbot.view","chatbot.train"]'::jsonb,
  true,
  true,
  NOW(),
  NOW()
);

-- Inserir role de Gerente
INSERT INTO roles (id, name, description, permissions, is_system, is_active, created_at, updated_at)
VALUES (
  'role_manager',
  'Gerente',
  'Gerente de parceiros com permissões de supervisão',
  '["dashboard.view","dashboard.analytics","clients.view","clients.create","clients.edit","referrals.view","referrals.create","referrals.validate","reports.view","reports.export","reports.all_partners","support.view","commissions.view","chatbot.view"]'::jsonb,
  true,
  true,
  NOW(),
  NOW()
);

-- Inserir role de Parceiro
INSERT INTO roles (id, name, description, permissions, is_system, is_active, created_at, updated_at)
VALUES (
  'role_partner',
  'Parceiro',
  'Parceiro padrão com permissões básicas',
  '["dashboard.view","clients.view","referrals.view","referrals.create","reports.view","support.view","commissions.view","chatbot.view"]'::jsonb,
  true,
  true,
  NOW(),
  NOW()
);

-- Verificar resultado
SELECT id, name, is_system, is_active,
       jsonb_array_length(permissions) as num_permissions
FROM roles
ORDER BY is_system DESC, name ASC;

-- =============================================================================
-- Adicionar Tabela de Funções/Roles
-- Execute este SQL no seu banco de dados
-- =============================================================================

-- Criar tabela roles
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON public.roles(is_system);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active);

-- Inserir funções padrão do sistema
INSERT INTO public.roles (id, name, description, permissions, is_system, is_active)
VALUES
  ('role_admin', 'Administrador', 'Acesso total ao sistema com todas as permissões',
   '["dashboard.view","dashboard.analytics","clients.view","clients.create","clients.edit","clients.delete","referrals.view","referrals.create","referrals.validate","referrals.approve","reports.view","reports.export","reports.all_partners","support.view","support.manage","admin.access","admin.users","admin.roles","admin.products","admin.pricing","admin.notifications","admin.integrations","admin.files","commissions.view","commissions.manage","chatbot.view","chatbot.train"]'::jsonb,
   true, true),

  ('role_manager', 'Gerente', 'Gerente de parceiros com permissões de supervisão',
   '["dashboard.view","dashboard.analytics","clients.view","clients.create","clients.edit","referrals.view","referrals.create","referrals.validate","reports.view","reports.export","reports.all_partners","support.view","commissions.view","chatbot.view"]'::jsonb,
   true, true),

  ('role_partner', 'Parceiro', 'Parceiro padrão com permissões básicas',
   '["dashboard.view","clients.view","referrals.view","referrals.create","reports.view","support.view","commissions.view","chatbot.view"]'::jsonb,
   true, true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar comentários para documentação
COMMENT ON TABLE public.roles IS 'Tabela de funções/roles com permissões do sistema';
COMMENT ON COLUMN public.roles.is_system IS 'Se true, é uma função do sistema que não pode ser deletada';
COMMENT ON COLUMN public.roles.permissions IS 'Array JSON com as permissões da função';

-- =============================================================================
-- ✅ TABELA ROLES CRIADA COM SUCESSO!
-- =============================================================================

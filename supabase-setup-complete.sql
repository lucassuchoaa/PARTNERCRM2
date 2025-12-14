-- =============================================================================
-- SUPABASE SETUP COMPLETO - Partners CRM
-- =============================================================================
-- Execute este SQL no Supabase SQL Editor para configurar TUDO de uma vez
-- Data: 2025-11-18
-- =============================================================================

-- =============================================================================
-- PARTE 1: CRIAR TODAS AS TABELAS
-- =============================================================================

-- 1. Pricing Plans
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  base_price numeric NOT NULL,
  included_users integer NOT NULL,
  additional_user_price numeric NOT NULL,
  features text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  "order" integer DEFAULT 1
);

-- 2. Users
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'partner')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  manager_id text,
  remuneration_table_ids integer[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  permissions text[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON public.users(manager_id);

-- 3. Remuneration Tables
CREATE TABLE IF NOT EXISTS public.remuneration_tables (
  id serial PRIMARY KEY,
  employee_range_start text NOT NULL,
  employee_range_end text,
  finder_negotiation_margin text NOT NULL,
  max_company_cashback text NOT NULL,
  final_finder_cashback text NOT NULL,
  description text,
  value_type text DEFAULT 'percentage' CHECK (value_type IN ('currency', 'percentage')),
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Support Materials
CREATE TABLE IF NOT EXISTS public.support_materials (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  description text,
  download_url text,
  view_url text,
  file_size text,
  duration text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_materials_category ON public.support_materials(category);

-- 5. Products
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  color text NOT NULL,
  is_active boolean DEFAULT true,
  "order" integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Prospects (Indicações)
CREATE TABLE IF NOT EXISTS public.prospects (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  employees TEXT NOT NULL,
  segment TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'in-analysis', 'approved', 'rejected')),
  partner_id TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by TEXT,
  validation_notes TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospects_partner_id ON public.prospects(partner_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON public.prospects(created_at);
CREATE INDEX IF NOT EXISTS idx_prospects_cnpj ON public.prospects(cnpj);

-- 7. Roles (Funções)
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

CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON public.roles(is_system);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active);

-- 8. Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  stage TEXT DEFAULT 'prospeccao' CHECK (stage IN ('prospeccao', 'negociacao', 'fechamento', 'ativo', 'inativo')),
  temperature TEXT DEFAULT 'frio' CHECK (temperature IN ('frio', 'morno', 'quente')),
  total_lives INTEGER DEFAULT 0,
  contract_end_date TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  partner_id TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  employees TEXT,
  segment TEXT,
  company_name TEXT,
  employee_count INTEGER,
  current_products TEXT[] DEFAULT '{}',
  viability_score INTEGER DEFAULT 50,
  potential_products TEXT[] DEFAULT '{}',
  last_analysis TEXT,
  potential_products_with_values JSONB,
  custom_recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_partner_id ON public.clients(partner_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON public.clients(cnpj);

-- =============================================================================
-- PARTE 2: INSERIR DADOS PADRÃO
-- =============================================================================

-- Inserir produtos padrão
INSERT INTO public.products (id, name, description, icon, color, is_active, "order")
VALUES
  ('folha', 'Folha de Pagamento', 'Pagamento 100% digital', 'CreditCardIcon', 'blue', true, 1),
  ('consignado', 'Consignado', 'Crédito consignado seguro', 'BanknotesIcon', 'green', true, 2),
  ('beneficios', 'Benefícios', 'Benefícios flexíveis', 'GiftIcon', 'purple', true, 3)
ON CONFLICT (id) DO NOTHING;

-- Inserir planos padrão
INSERT INTO public.pricing_plans (id, name, description, base_price, included_users, additional_user_price, features, is_active, "order")
VALUES
  ('starter', 'Starter', 'Ideal para pequenas empresas começando a digitalizar seus processos', 299.9, 5, 49.9,
   '{Até 5 usuários inclusos,Dashboard básico,Gestão de clientes,Indicações de parceiros,Suporte por email,Relatórios mensais}', true, 1),
  ('professional', 'Professional', 'Para empresas em crescimento que precisam de mais recursos', 599.9, 15, 39.9,
   '{Até 15 usuários inclusos,Dashboard avançado,Gestão completa de clientes,Sistema de indicações premium,Integrações com NetSuite e HubSpot,ChatBot com IA,Suporte prioritário,Relatórios personalizados,API de integração}', true, 2),
  ('enterprise', 'Enterprise', 'Solução completa para grandes empresas com necessidades avançadas', 1299.9, 50, 29.9,
   '{Até 50 usuários inclusos,Dashboard enterprise com analytics,CRM completo com automações,Sistema de indicações multi-nível,Todas as integrações disponíveis,ChatBot com IA personalizado,Gestão de produtos e estoque,Suporte 24/7 dedicado,Relatórios em tempo real,API ilimitada,Treinamento personalizado,Gerente de conta dedicado}', true, 3)
ON CONFLICT (id) DO NOTHING;

-- Inserir funções padrão
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

-- =============================================================================
-- PARTE 3: DESABILITAR RLS (Row Level Security)
-- =============================================================================
-- ⚠️ IMPORTANTE: Isso permite acesso total às tabelas via service_role key
-- Em produção, você pode configurar políticas RLS mais específicas

ALTER TABLE public.pricing_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneration_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PARTE 4: CONFIGURAR STORAGE (Upload de Arquivos)
-- =============================================================================
-- Nota: Comandos de Storage precisam ser executados via Supabase Dashboard ou API
-- Mas vou criar a estrutura SQL para políticas de acesso

-- Criar bucket 'partner-files' (fazer manualmente no Storage ou via CLI/API)
-- 1. Vá em Storage → Create Bucket
-- 2. Nome: partner-files
-- 3. Public: true (para URLs públicas)
-- 4. Allowed MIME types: deixe vazio (permite todos)

-- Políticas de Storage (após criar o bucket manualmente)
-- Essas políticas permitem upload, download e deleção de arquivos

-- Policy: Permitir upload de arquivos
CREATE POLICY "Service role can upload files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'partner-files');

-- Policy: Permitir leitura de arquivos
CREATE POLICY "Anyone can view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'partner-files');

-- Policy: Permitir deleção de arquivos
CREATE POLICY "Service role can delete files"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'partner-files');

-- Policy: Permitir atualização de arquivos
CREATE POLICY "Service role can update files"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'partner-files');

-- =============================================================================
-- PARTE 5: VERIFICAÇÃO FINAL
-- =============================================================================
-- Execute estas queries para verificar se tudo foi criado corretamente

-- Verificar tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar dados iniciais
SELECT 'Products' as table_name, COUNT(*) as count FROM public.products
UNION ALL
SELECT 'Pricing Plans', COUNT(*) FROM public.pricing_plans
UNION ALL
SELECT 'Users', COUNT(*) FROM public.users
UNION ALL
SELECT 'Remuneration Tables', COUNT(*) FROM public.remuneration_tables
UNION ALL
SELECT 'Support Materials', COUNT(*) FROM public.support_materials;

-- Verificar RLS status (deve estar DISABLED)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- ✅ SETUP COMPLETO!
-- =============================================================================
-- Próximos passos:
-- 1. ✅ Todas as tabelas criadas
-- 2. ✅ Dados padrão inseridos
-- 3. ✅ RLS desabilitado
-- 4. ⚠️ CRIAR BUCKET MANUALMENTE:
--    - Vá em Storage → Create Bucket
--    - Nome: partner-files
--    - Public: true
--    - Clique em Create
-- 5. ✅ Políticas de Storage criadas (executam automaticamente após criar bucket)
-- 6. 🚀 Fazer REDEPLOY no Vercel
-- 7. 🎉 Testar todas as funcionalidades!
-- =============================================================================

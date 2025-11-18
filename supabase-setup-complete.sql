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

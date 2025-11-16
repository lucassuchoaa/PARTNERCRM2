-- =============================================================================
-- Supabase Schema - Partners CRM
-- Execute este SQL no Supabase SQL Editor para criar todas as tabelas
-- =============================================================================

-- 1. Pricing Plans (já criado, mas deixando aqui para referência)
create table if not exists public.pricing_plans (
  id text primary key,
  name text not null,
  description text,
  base_price numeric not null,
  included_users integer not null,
  additional_user_price numeric not null,
  features text[] default '{}',
  is_active boolean default true,
  "order" integer default 1
);

-- 2. Users
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  name text not null,
  password text not null,
  role text not null check (role in ('admin', 'manager', 'partner')),
  status text default 'active' check (status in ('active', 'inactive')),
  manager_id text,
  remuneration_table_ids integer[] default '{}',
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone,
  permissions text[] default '{}'
);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_manager_id on public.users(manager_id);

-- 3. Remuneration Tables
create table if not exists public.remuneration_tables (
  id serial primary key,
  employee_range_start text not null,
  employee_range_end text,
  finder_negotiation_margin text not null,
  max_company_cashback text not null,
  final_finder_cashback text not null,
  description text,
  value_type text default 'percentage' check (value_type in ('currency', 'percentage')),
  created_at timestamp with time zone default now()
);

-- 4. Support Materials
create table if not exists public.support_materials (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text not null,
  type text not null,
  description text,
  download_url text,
  view_url text,
  file_size text,
  duration text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_support_materials_category on public.support_materials(category);

-- 5. Products (customizáveis)
create table if not exists public.products (
  id text primary key,
  name text not null,
  description text,
  icon text not null,
  color text not null,
  is_active boolean default true,
  "order" integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Inserir produtos padrão se não existirem
insert into public.products (id, name, description, icon, color, is_active, "order")
values
  ('folha', 'Folha de Pagamento', 'Pagamento 100% digital', 'CreditCardIcon', 'blue', true, 1),
  ('consignado', 'Consignado', 'Crédito consignado seguro', 'BanknotesIcon', 'green', true, 2),
  ('beneficios', 'Benefícios', 'Benefícios flexíveis', 'GiftIcon', 'purple', true, 3)
on conflict (id) do nothing;

-- Inserir planos padrão se não existirem
insert into public.pricing_plans (id, name, description, base_price, included_users, additional_user_price, features, is_active, "order")
values
  ('starter', 'Starter', 'Ideal para pequenas empresas começando a digitalizar seus processos', 299.9, 5, 49.9, 
   '{Até 5 usuários inclusos,Dashboard básico,Gestão de clientes,Indicações de parceiros,Suporte por email,Relatórios mensais}', true, 1),
  ('professional', 'Professional', 'Para empresas em crescimento que precisam de mais recursos', 599.9, 15, 39.9,
   '{Até 15 usuários inclusos,Dashboard avançado,Gestão completa de clientes,Sistema de indicações premium,Integrações com NetSuite e HubSpot,ChatBot com IA,Suporte prioritário,Relatórios personalizados,API de integração}', true, 2),
  ('enterprise', 'Enterprise', 'Solução completa para grandes empresas com necessidades avançadas', 1299.9, 50, 29.9,
   '{Até 50 usuários inclusos,Dashboard enterprise com analytics,CRM completo com automações,Sistema de indicações multi-nível,Todas as integrações disponíveis,ChatBot com IA personalizado,Gestão de produtos e estoque,Suporte 24/7 dedicado,Relatórios em tempo real,API ilimitada,Treinamento personalizado,Gerente de conta dedicado}', true, 3)
on conflict (id) do nothing;


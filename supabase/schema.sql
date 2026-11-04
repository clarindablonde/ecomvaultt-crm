-- ==============================================================================
-- ECOMVAULTT COMMERCE OS - SUPABASE DATABASE SCHEMA
-- Designed for Multi-Warehouse E-Commerce, WhatsApp CRM & COD Logistics
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ------------------------------------------------------------------------------
create type user_role as enum (
  'super_admin',
  'representative',
  'logistics_officer',
  'finance',
  'warehouse_manager'
);

create type channel_type as enum (
  'whatsapp',
  'instagram',
  'facebook',
  'tiktok',
  'phone',
  'walk_in'
);

create type order_status as enum (
  'in_conversation',
  'confirmed',
  'awaiting_dispatch',
  'out_for_delivery',
  'delivered_paid',
  'transferred_to_bank',
  'failed_unreachable',
  'failed_cancelled',
  'rescheduled'
);

create type payment_method as enum (
  'cod_cash',
  'cod_transfer',
  'prepaid_bank_transfer',
  'prepaid_paystack',
  'prepaid_flutterwave'
);

create type payment_status as enum (
  'pending',
  'holding_by_dispatcher',
  'transferred_to_bank',
  'verified_by_finance',
  'refunded'
);

create type approval_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type expense_category as enum (
  'dispatch_fuel_repairs',
  'advertising',
  'office_utilities',
  'packaging',
  'salaries_commission',
  'inventory_freight',
  'miscellaneous'
);

-- ------------------------------------------------------------------------------
-- 2. STAFF & PROFILES (Linked with auth.users)
-- ------------------------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role user_role not null default 'representative',
  avatar_code text default 'CL',
  avatar_color text default 'a1',
  phone_number text,
  is_online boolean default false,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 3. WAREHOUSES & LOCATIONS
-- ------------------------------------------------------------------------------
create table public.warehouses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,               -- e.g. "Lagos (Ikeja)", "Abuja (Wuse II)"
  code text unique not null,         -- e.g. "LOS-IKJ", "ABJ-WUS", "PH-GRA", "ACC-GH"
  state_city text not null,
  address text,
  manager_id uuid references public.profiles(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 4. PRODUCTS & CATALOG
-- ------------------------------------------------------------------------------
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  title text not null,
  description text,
  selling_price numeric(12,2) not null check (selling_price >= 0),
  cost_price numeric(12,2) not null check (cost_price >= 0), -- Super Admin / Finance view only
  nafdac_reg_number text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 5. WAREHOUSE INVENTORY (Per-location stock ledger)
-- ------------------------------------------------------------------------------
create table public.inventory (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  stock_reserved integer not null default 0 check (stock_reserved >= 0),
  reorder_threshold integer not null default 20,
  updated_at timestamptz default now(),
  unique (warehouse_id, product_id)
);

-- ------------------------------------------------------------------------------
-- 6. INVENTORY INTAKES & RESTOCK APPROVALS
-- ------------------------------------------------------------------------------
create table public.inventory_intakes (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references public.warehouses(id) not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  batch_number text,
  status approval_status not null default 'pending',
  requested_by uuid references public.profiles(id) not null,
  approved_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- ------------------------------------------------------------------------------
-- 7. CUSTOMERS (Customer 360)
-- ------------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone_number text not null unique,
  alternate_phone text,
  email text,
  instagram_handle text,
  delivery_address text,
  city text,
  state text,
  health_score integer default 85 check (health_score between 0 and 100),
  tags text[] default array['new_customer'], -- e.g. {'vip', 'ready_to_buy', 'at_risk'}
  source_channel channel_type default 'whatsapp',
  lifetime_orders integer default 0,
  lifetime_spend numeric(12,2) default 0,
  last_purchase_date timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 8. CONVERSATIONS & OMNICHANNEL MESSAGING
-- ------------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  assigned_rep_id uuid references public.profiles(id),
  channel channel_type default 'whatsapp',
  external_chat_id text,           -- WhatsApp phone or IG user ID
  last_message text,
  last_message_at timestamptz default now(),
  unread_count integer default 0,
  priority_flag text,              -- 'at_risk', 'ready_to_buy', 'vip', 'follow_up'
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_type text not null check (sender_type in ('customer', 'rep', 'ai', 'system')),
  sender_id uuid references public.profiles(id),
  body text not null,
  media_url text,
  is_voice_note boolean default false,
  voice_transcript text,
  is_edited boolean default false,
  edited_at timestamptz,
  ai_coaching_suggestion text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 9. ORDERS & COMMERCE PIPELINE
-- ------------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_code text unique not null,   -- e.g. 'EV-4821'
  customer_id uuid references public.customers(id) not null,
  assigned_rep_id uuid references public.profiles(id),
  warehouse_id uuid references public.warehouses(id) not null,
  status order_status not null default 'in_conversation',
  payment_method payment_method default 'cod_cash',
  payment_status payment_status default 'pending',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_amount numeric(12,2) default 0,
  delivery_fee numeric(12,2) default 0,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  delivery_address text,
  delivery_city text,
  delivery_state text,
  delivery_scheduled_for date,
  delivery_time_window text,         -- e.g. "8:00 AM - 10:00 AM"
  follow_up_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 10. DISPATCH & RIDER COD RECONCILIATION
-- ------------------------------------------------------------------------------
create table public.dispatch_assignments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  warehouse_id uuid references public.warehouses(id) not null,
  rider_name text not null,
  rider_phone text not null,
  assigned_at timestamptz default now(),
  delivered_at timestamptz,
  cash_amount_due numeric(12,2) not null check (cash_amount_due >= 0),
  cash_amount_collected numeric(12,2) default 0 check (cash_amount_collected >= 0),
  cash_remitted_to_bank boolean default false,
  bank_remittance_proof_url text,
  bank_remittance_verified_by uuid references public.profiles(id),
  failure_reason text,
  status text not null default 'assigned' -- 'assigned', 'in_transit', 'delivered', 'failed', 'returned'
);

-- ------------------------------------------------------------------------------
-- 11. EXPENSES & APPROVAL WORKFLOW
-- ------------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category expense_category not null,
  amount numeric(12,2) not null check (amount > 0),
  warehouse_id uuid references public.warehouses(id),
  receipt_url text,
  status approval_status not null default 'pending',
  submitted_by uuid references public.profiles(id) not null,
  approved_by uuid references public.profiles(id),
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 12. AUDIT LOGS
-- ------------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  action text not null,           -- e.g. 'STOCK_ADJUSTMENT', 'PRICE_CHANGE', 'ORDER_STATUS_UPDATE'
  entity_type text not null,      -- 'orders', 'inventory', 'expenses'
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 13. AUTOMATED TRIGGERS & FUNCTIONS
-- ------------------------------------------------------------------------------

-- Trigger: Automatically create public.profiles row when auth.users signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Staff Member'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'representative')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: When order status changes to delivered_paid, increment customer lifetime metrics
create or replace function public.sync_customer_metrics_on_order()
returns trigger as $$
begin
  if new.status = 'delivered_paid' and (old.status is null or old.status != 'delivered_paid') then
    update public.customers
    set
      lifetime_orders = lifetime_orders + 1,
      lifetime_spend = lifetime_spend + new.total_amount,
      last_purchase_date = now(),
      tags = array_append(array_remove(tags, 'new_customer'), 'loyal')
    where id = new.customer_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_delivered_paid
  after update on public.orders
  for each row execute function public.sync_customer_metrics_on_order();

-- ------------------------------------------------------------------------------
-- 14. REALTIME REPLICATION ENABLEMENT
-- ------------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.dispatch_assignments;
alter publication supabase_realtime add table public.inventory;

-- ------------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.expenses enable row level security;
alter table public.inventory enable row level security;

-- Basic authenticated access policies
create policy "Authenticated staff can view profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Authenticated staff can view products" on public.products
  for select using (auth.role() = 'authenticated');

create policy "Authenticated staff can view and manage customers" on public.customers
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can view and manage orders" on public.orders
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can view and manage order items" on public.order_items
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can view and send messages" on public.messages
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can view conversations" on public.conversations
  for all using (auth.role() = 'authenticated');

create policy "Staff can view inventory" on public.inventory
  for select using (auth.role() = 'authenticated');

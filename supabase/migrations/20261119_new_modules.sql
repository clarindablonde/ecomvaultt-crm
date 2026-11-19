-- ==============================================================================
-- ECOMVAULTT COMMERCE OS — NEW MODULES MIGRATION (IDEMPOTENT & RESILIENT)
-- Adds: Expenses (patching existing table), Marketing Campaigns, Promo Codes,
-- Discussion Channels, Messages, Knowledge Base Articles, and Staff Roster.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. EXPENSES TABLE (Handles both new and pre-existing schema)
-- ------------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  code text,
  title text not null,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  paid_via text default 'Zenith Corporate Transfer',
  warehouse_id uuid references public.warehouses(id) on delete set null,
  receipt_url text,
  status text not null default 'approved',
  recorded_by text default 'Clarinda O.',
  expense_date timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

-- Ensure all columns and types exist even if public.expenses already existed
do $$
begin
  -- Add code column if not present
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'expenses' and column_name = 'code') then
    alter table public.expenses add column code text;
  end if;

  -- Add paid_via column if not present
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'expenses' and column_name = 'paid_via') then
    alter table public.expenses add column paid_via text default 'Zenith Corporate Transfer';
  end if;

  -- Add recorded_by column if not present
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'expenses' and column_name = 'recorded_by') then
    alter table public.expenses add column recorded_by text default 'Clarinda O.';
  end if;

  -- Make submitted_by nullable if it was non-null in older schema
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'expenses' and column_name = 'submitted_by') then
    alter table public.expenses alter column submitted_by drop not null;
  end if;

  -- Convert category to text if it was an enum
  alter table public.expenses alter column category type text using category::text;

  -- Convert status to text if it was an enum
  alter table public.expenses alter column status type text using status::text;
exception when others then
  null;
end $$;

-- Seed Initial Expenses
insert into public.expenses (code, title, category, amount, paid_via, recorded_by, status)
select 'EXP-1092', 'Dispatch Rider Fuel Allowance & Bike Maintenance (Lagos Mainland)', 'logistics', 85000.00, 'Zenith Corporate Transfer', 'Clarinda O.', 'approved'
where not exists (select 1 from public.expenses where code = 'EXP-1092');

insert into public.expenses (code, title, category, amount, paid_via, recorded_by, status)
select 'EXP-1091', 'Custom Clarinda Blonde Holographic Bubble Mailers (x2,500 units)', 'packaging', 320000.00, 'Access Bank OPEX', 'Admin Ops', 'approved'
where not exists (select 1 from public.expenses where code = 'EXP-1091');

insert into public.expenses (code, title, category, amount, paid_via, recorded_by, status)
select 'EXP-1090', 'Meta Ads Manager Campaign (WhatsApp Click-to-Chat Scaling)', 'marketing', 450000.00, 'USD Virtual Card', 'Growth Lead', 'approved'
where not exists (select 1 from public.expenses where code = 'EXP-1090');

insert into public.expenses (code, title, category, amount, paid_via, recorded_by, status)
select 'EXP-1089', 'Abuja Regional Fulfillment Hub Backup Generator Diesel (150L)', 'warehousing', 195000.00, 'Petty Cash', 'Hub Supervisor', 'approved'
where not exists (select 1 from public.expenses where code = 'EXP-1089');


-- ------------------------------------------------------------------------------
-- 2. MARKETING CAMPAIGNS & PROMO CODES
-- ------------------------------------------------------------------------------
create table if not exists public.marketing_campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  channel text not null default 'WhatsApp Broadcast',
  audience_size integer not null default 0,
  delivery_rate text default '98.5%',
  click_rate text default '32.0%',
  orders_generated integer default 0,
  revenue numeric(12,2) default 0.00,
  status text default 'active',
  created_at timestamptz default now()
);

insert into public.marketing_campaigns (name, channel, audience_size, delivery_rate, click_rate, orders_generated, revenue, status)
select 'Black Friday VIP Early Access (Royal Velvet Bundle)', 'WhatsApp Broadcast', 1420, '98.6%', '34.2%', 86, 3096000.00, 'active'
where not exists (select 1 from public.marketing_campaigns where name like 'Black Friday%');

insert into public.marketing_campaigns (name, channel, audience_size, delivery_rate, click_rate, orders_generated, revenue, status)
select 'Abuja Free Delivery Weekend Flash Blast', 'WhatsApp Broadcast', 840, '99.1%', '28.5%', 42, 1512000.00, 'completed'
where not exists (select 1 from public.marketing_campaigns where name like 'Abuja Free Delivery%');

insert into public.marketing_campaigns (name, channel, audience_size, delivery_rate, click_rate, orders_generated, revenue, status)
select 'Abandoned Cart 2-Hour Recovery Automation', 'WhatsApp Broadcast', 310, '97.4%', '41.0%', 58, 2088000.00, 'active'
where not exists (select 1 from public.marketing_campaigns where name like 'Abandoned Cart%');


create table if not exists public.promo_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_type text default 'percentage',
  discount_value numeric(12,2) not null,
  description text,
  min_order_amount numeric(12,2) default 0.00,
  usage_count integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.promo_codes (code, discount_type, discount_value, description, min_order_amount, usage_count, is_active)
values
  ('VIP10', 'percentage', 10.00, '10% Off Orders over ₦50,000 for VIP Customers', 50000.00, 68, true),
  ('ABUJAFREE', 'fixed', 3500.00, 'Free Delivery Discount in Abuja Regional Hub', 30000.00, 42, true),
  ('WELCOME5', 'percentage', 5.00, '5% Off First-Time Customer Orders', 20000.00, 115, true)
on conflict (code) do nothing;


-- ------------------------------------------------------------------------------
-- 3. TEAM DISCUSSION CHANNELS & MESSAGES
-- ------------------------------------------------------------------------------
create table if not exists public.discussion_channels (
  id text primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

insert into public.discussion_channels (id, name, description) values
  ('general-ops', 'general-ops', 'Company announcements & general staff updates'),
  ('dispatch-alerts', 'dispatch-alerts', 'Rider delays, failed addresses & transit notes'),
  ('vip-escalations', 'vip-escalations', 'High-value customer requests & urgent changes'),
  ('shift-handover', 'shift-handover', 'Morning / evening sales rep order handovers')
on conflict (id) do nothing;

create table if not exists public.discussion_messages (
  id uuid primary key default uuid_generate_v4(),
  channel_id text references public.discussion_channels(id) on delete cascade,
  author text not null,
  author_role text default 'Team Member',
  avatar_color text default 'a1',
  content text not null,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

insert into public.discussion_messages (channel_id, author, author_role, avatar_color, content, is_pinned)
select 'dispatch-alerts', 'Tunde Dispatch', 'Lagos Fleet Lead', 'a2', '🚨 Notice: Heavy traffic along Lekki-Epe expressway due to road maintenance. Riders assigned to Ajah and Sangotedo deliveries might experience a 30-45 minute delay.', true
where not exists (select 1 from public.discussion_messages where author = 'Tunde Dispatch');

insert into public.discussion_messages (channel_id, author, author_role, avatar_color, content, is_pinned)
select 'dispatch-alerts', 'Clarinda O.', 'Administrator', 'a1', 'Thanks for the update Tunde. Please let customer service know so we can send proactive WhatsApp notifications to the 6 customers in that delivery zone.', false
where not exists (select 1 from public.discussion_messages where author = 'Clarinda O.');


-- ------------------------------------------------------------------------------
-- 4. KNOWLEDGE BASE ARTICLES & SOPS
-- ------------------------------------------------------------------------------
create table if not exists public.knowledge_articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null,
  excerpt text,
  content text not null,
  read_time text default '3 min read',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.knowledge_articles (title, category, excerpt, content, read_time)
select
  'Standard Operating Procedure: Rider Same-Day Dispatch & Delivery Escalations',
  'logistics',
  'Detailed workflow for assigning orders to Lagos and Abuja hubs, handling uncontactable customers, and recording delivery attempts.',
  E'1. Order Verification: Before dispatching any rider, confirm customer availability by calling 30 minutes prior to departure.\n2. In-Transit Delays: If a customer does not pick up at the location after 3 attempts, rider must log a "Delivery Attempt Failed" status in the Clarinda OS Dispatch portal.\n3. Package Handover: Cash-On-Delivery packages must only be handed over after physical cash or instant bank transfer confirmation. Never leave parcels on promise to transfer later.',
  '4 min read'
where not exists (select 1 from public.knowledge_articles where title like 'Standard Operating Procedure%');

insert into public.knowledge_articles (title, category, excerpt, content, read_time)
select
  'Cash-on-Delivery (COD) Reconciliation & Daily Bank Remittance Policy',
  'finance',
  'Accounting controls for auditing cash held by dispatchers and confirming remittance into Zenith/Access accounts.',
  E'1. Daily Cash Drop: All riders must remit cash collected from delivered COD orders before 6:30 PM daily at their respective warehouse hub.\n2. Bank Transfer Verification: For customers paying via bank transfer on delivery, riders must demand payment receipt with valid session ID, confirmed by warehouse finance officer.\n3. Audit Clearance: Once funds reflect in corporate bank statement, mark order as "Verified in Bank" in the Payments module.',
  '3 min read'
where not exists (select 1 from public.knowledge_articles where title like 'Cash-on-Delivery%');

insert into public.knowledge_articles (title, category, excerpt, content, read_time)
select
  'WhatsApp Sales Scripts: Handling Objections on Delivery Fees & Pricing',
  'sales',
  'High-converting objection handling playbooks for customer service representatives when closing WhatsApp leads.',
  E'1. Objection: "Is delivery free to Port Harcourt?"\nResponse: "Hello lovely! All Lagos orders qualify for subsidised ₦2,000 same-day dispatch. For Port Harcourt, we offer insured air cargo at ₦3,500. However, if you purchase our Royal Velvet Suite Duo today, we cover your delivery 100% free!"\n\n2. Objection: "Can I pay after testing the fragrance?"\nResponse: "Our products arrive factory sealed with holographic authenticity seals. You can inspect the intact packaging upon delivery with our dedicated rider before settling your payment!"',
  '5 min read'
where not exists (select 1 from public.knowledge_articles where title like 'WhatsApp Sales Scripts%');

insert into public.knowledge_articles (title, category, excerpt, content, read_time)
select
  'Damaged Goods & Return Replacement Guidelines',
  'policy',
  'Customer satisfaction protocol for transit damage, broken perfume atomizers, and exchange authorization.',
  E'1. Reporting Window: Customers must notify customer support with photo/video evidence within 24 hours of package receipt.\n2. Immediate Replacement: For verified transit leaks or broken glass, dispatch replacement immediately from the nearest regional warehouse hub at company expense.\n3. Reverse Logistics: The rider collects the damaged unit for quality inspection logging.',
  '3 min read'
where not exists (select 1 from public.knowledge_articles where title like 'Damaged Goods%');


-- ------------------------------------------------------------------------------
-- 5. STAFF ROSTER & FLEET DIRECTORY
-- ------------------------------------------------------------------------------
create table if not exists public.staff_roster (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  role text not null,
  department text not null,
  hub text not null,
  phone text not null,
  status text default 'Active',
  rating numeric(2,1) default 4.8,
  avatar_color text default 'a1',
  created_at timestamptz default now()
);

insert into public.staff_roster (name, role, department, hub, phone, status, rating, avatar_color)
select 'Clarinda O.', 'Managing Director & Founder', 'Executive', 'Lagos Headquarters', '+234 802 000 0001', 'Active', 5.0, 'a1'
where not exists (select 1 from public.staff_roster where name = 'Clarinda O.');

insert into public.staff_roster (name, role, department, hub, phone, status, rating, avatar_color)
select 'Tunde Babalola', 'Lead Dispatch Rider', 'Logistics', 'Lagos Island & Lekki Phase 1', '+234 803 441 9021', 'On Delivery', 4.9, 'a2'
where not exists (select 1 from public.staff_roster where name = 'Tunde Babalola');

insert into public.staff_roster (name, role, department, hub, phone, status, rating, avatar_color)
select 'Sarah Adekunle', 'Senior WhatsApp Sales Specialist', 'Sales', 'Lagos HQ / Remote', '+234 812 559 1042', 'Active', 4.8, 'a4'
where not exists (select 1 from public.staff_roster where name = 'Sarah Adekunle');

insert into public.staff_roster (name, role, department, hub, phone, status, rating, avatar_color)
select 'Emeka Nwosu', 'Abuja Regional Hub Supervisor', 'Operations', 'Abuja Capital Hub (Wuse 2)', '+234 901 883 2291', 'Active', 4.9, 'a3'
where not exists (select 1 from public.staff_roster where name = 'Emeka Nwosu');

insert into public.staff_roster (name, role, department, hub, phone, status, rating, avatar_color)
select 'Musa Ibrahim', 'Express Dispatch Rider', 'Logistics', 'Abuja Capital Hub (Wuse & Garki)', '+234 809 112 4003', 'On Delivery', 4.7, 'a2'
where not exists (select 1 from public.staff_roster where name = 'Musa Ibrahim');

insert into public.staff_roster (name, role, department, hub, phone, status, rating, avatar_color)
select 'Fatima Sanusi', 'Customer Care & Retention Rep', 'Sales', 'Port Harcourt Hub', '+234 703 661 8890', 'Active', 4.8, 'a3'
where not exists (select 1 from public.staff_roster where name = 'Fatima Sanusi');


-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY & REALTIME REPLICATION
-- ------------------------------------------------------------------------------
alter table public.expenses enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.promo_codes enable row level security;
alter table public.discussion_channels enable row level security;
alter table public.discussion_messages enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.staff_roster enable row level security;

-- Open policies for internal staff operations
drop policy if exists "expenses_access_policy" on public.expenses;
create policy "expenses_access_policy" on public.expenses for all using (true) with check (true);

drop policy if exists "marketing_campaigns_access_policy" on public.marketing_campaigns;
create policy "marketing_campaigns_access_policy" on public.marketing_campaigns for all using (true) with check (true);

drop policy if exists "promo_codes_access_policy" on public.promo_codes;
create policy "promo_codes_access_policy" on public.promo_codes for all using (true) with check (true);

drop policy if exists "discussion_channels_access_policy" on public.discussion_channels;
create policy "discussion_channels_access_policy" on public.discussion_channels for all using (true) with check (true);

drop policy if exists "discussion_messages_access_policy" on public.discussion_messages;
create policy "discussion_messages_access_policy" on public.discussion_messages for all using (true) with check (true);

drop policy if exists "knowledge_articles_access_policy" on public.knowledge_articles;
create policy "knowledge_articles_access_policy" on public.knowledge_articles for all using (true) with check (true);

drop policy if exists "staff_roster_access_policy" on public.staff_roster;
create policy "staff_roster_access_policy" on public.staff_roster for all using (true) with check (true);

-- Enable Supabase Realtime for dynamic live sync
do $$
begin
  alter publication supabase_realtime add table public.expenses;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.marketing_campaigns;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.promo_codes;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.discussion_messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.staff_roster;
exception when others then null;
end $$;

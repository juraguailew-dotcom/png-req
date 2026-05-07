-- =============================================
-- PNG Requisition System - Complete Schema V4
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================
-- USERS PROFILE TABLE
-- =============================================
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz default now() not null,
  email text unique not null,
  full_name text,
  role text not null check (role in ('admin','hardware_shop','contractor')),
  avatar_url text,
  phone text,
  address text,
  city text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  verified boolean default false,
  business_name text,
  business_registration text,
  last_login timestamptz
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Admins can view all users"
  on public.users for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update all users"
  on public.users for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Service role can insert users"
  on public.users for insert
  with check (true);

-- =============================================
-- PRODUCT CATEGORIES
-- =============================================
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  name text unique not null,
  description text,
  icon text
);

alter table public.categories enable row level security;

create policy "All authenticated can view categories"
  on public.categories for select
  using (auth.role() = 'authenticated');

create policy "Admins manage categories"
  on public.categories for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Insert default categories
insert into public.categories (name, description) values
  ('Building Materials', 'Cement, bricks, timber, etc.'),
  ('Electrical', 'Wires, switches, lights, etc.'),
  ('Plumbing', 'Pipes, fittings, taps, etc.'),
  ('Tools', 'Hand tools, power tools, etc.'),
  ('Paint & Finishing', 'Paint, brushes, sandpaper, etc.'),
  ('Hardware', 'Nails, screws, bolts, etc.'),
  ('Safety Equipment', 'Helmets, gloves, boots, etc.'),
  ('General', 'Miscellaneous items')
on conflict (name) do nothing;

-- =============================================
-- PRODUCTS
-- =============================================
drop table if exists public.products cascade;

create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  shop_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  category_name text,
  
  -- Pricing
  pricing_method text default 'unit' check (pricing_method in ('unit','bulk','category')),
  unit_price numeric(10,2) default 0,
  bulk_pricing jsonb default '[]', -- [{min_qty: 10, price: 9.50}, ...]
  unit text default 'unit',
  
  -- Inventory
  stock integer default 0,
  low_stock_threshold integer default 10,
  
  -- Media
  images jsonb default '[]', -- Array of image URLs
  
  -- Status
  active boolean default true,
  
  -- Search
  search_vector tsvector
);

alter table public.products enable row level security;

create policy "Shop manages own products"
  on public.products for all
  using (auth.uid() = shop_id);

create policy "All authenticated can view active products"
  on public.products for select
  using (auth.role() = 'authenticated' and active = true);

-- Full-text search index
create index products_search_idx on public.products using gin(search_vector);

-- Trigger to update search vector
create or replace function products_search_trigger() returns trigger as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.name,'') || ' ' || coalesce(new.description,''));
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger products_search_update before insert or update
  on public.products for each row execute function products_search_trigger();

-- =============================================
-- REQUISITIONS
-- =============================================
drop table if exists public.requisitions cascade;

create table public.requisitions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Requester
  contractor_id uuid references public.users(id) on delete cascade not null,
  contractor_name text,
  
  -- Items (array of {product_id, product_name, quantity, unit_price, total})
  items jsonb not null default '[]',
  total_amount numeric(10,2) default 0,
  
  -- Status workflow
  status text not null default 'pending' check (status in ('pending','approved','rejected','fulfilled','cancelled')),
  
  -- Approval (if total > K5000)
  requires_approval boolean default false,
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  approval_comment text,
  
  -- Assignment
  assigned_shop_id uuid references public.users(id) on delete set null,
  assigned_shop_name text,
  
  -- Fulfillment
  fulfilled_by uuid references public.users(id) on delete set null,
  fulfilled_at timestamptz,
  fulfillment_notes text,
  
  -- Additional
  notes text,
  template_id uuid references public.templates(id) on delete set null
);

alter table public.requisitions enable row level security;

create policy "Contractors view own requisitions"
  on public.requisitions for select
  using (auth.uid() = contractor_id);

create policy "Contractors create requisitions"
  on public.requisitions for insert
  with check (auth.uid() = contractor_id);

create policy "Contractors update own pending requisitions"
  on public.requisitions for update
  using (auth.uid() = contractor_id and status = 'pending');

create policy "Contractors delete own pending requisitions"
  on public.requisitions for delete
  using (auth.uid() = contractor_id and status = 'pending');

create policy "Shops view assigned requisitions"
  on public.requisitions for select
  using (auth.uid() = assigned_shop_id);

create policy "Shops update assigned requisitions"
  on public.requisitions for update
  using (auth.uid() = assigned_shop_id);

create policy "Admins manage all requisitions"
  on public.requisitions for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =============================================
-- TEMPLATES
-- =============================================
drop table if exists public.templates cascade;

create table public.templates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  items jsonb not null default '[]', -- [{product_id, product_name, quantity}]
  is_public boolean default false
);

alter table public.templates enable row level security;

create policy "Users manage own templates"
  on public.templates for all
  using (auth.uid() = user_id);

create policy "All can view public templates"
  on public.templates for select
  using (is_public = true);

-- =============================================
-- FAVOURITES
-- =============================================
drop table if exists public.favourites cascade;

create table public.favourites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references public.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade,
  shop_id uuid references public.users(id) on delete cascade,
  unique(user_id, product_id),
  unique(user_id, shop_id),
  check ((product_id is not null and shop_id is null) or (product_id is null and shop_id is not null))
);

alter table public.favourites enable row level security;

create policy "Users manage own favourites"
  on public.favourites for all
  using (auth.uid() = user_id);

-- =============================================
-- REVIEWS & RATINGS
-- =============================================
drop table if exists public.reviews cascade;

create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  requisition_id uuid references public.requisitions(id) on delete cascade not null,
  reviewer_id uuid references public.users(id) on delete cascade not null,
  reviewee_id uuid references public.users(id) on delete cascade not null,
  
  rating integer check (rating between 1 and 5) not null,
  comment text,
  
  unique(requisition_id, reviewer_id, reviewee_id)
);

alter table public.reviews enable row level security;

create policy "Users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = reviewer_id);

create policy "All authenticated can read reviews"
  on public.reviews for select
  using (auth.role() = 'authenticated');

-- =============================================
-- MESSAGES / CHAT
-- =============================================
drop table if exists public.messages cascade;

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  
  content text not null,
  attachments jsonb default '[]', -- Array of file URLs
  
  read boolean default false not null,
  read_at timestamptz,
  
  requisition_id uuid references public.requisitions(id) on delete set null,
  is_bot_message boolean default false
);

alter table public.messages enable row level security;

create policy "Users view own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users update received messages"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- Index for faster queries
create index messages_sender_idx on public.messages(sender_id, created_at desc);
create index messages_receiver_idx on public.messages(receiver_id, created_at desc);

-- =============================================
-- NOTIFICATIONS
-- =============================================
drop table if exists public.notifications cascade;

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  
  user_id uuid references public.users(id) on delete cascade not null,
  
  type text not null check (type in ('requisition','message','review','dispute','system','low_stock')),
  title text not null,
  message text not null,
  
  read boolean default false not null,
  read_at timestamptz,
  
  link text,
  metadata jsonb default '{}'
);

alter table public.notifications enable row level security;

create policy "Users manage own notifications"
  on public.notifications for all
  using (auth.uid() = user_id);

create policy "Service role inserts notifications"
  on public.notifications for insert
  with check (true);

-- Index for faster queries
create index notifications_user_unread_idx on public.notifications(user_id, read, created_at desc);

-- =============================================
-- INVOICES
-- =============================================
drop table if exists public.invoices cascade;

create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  
  requisition_id uuid references public.requisitions(id) on delete cascade not null,
  shop_id uuid references public.users(id) on delete cascade not null,
  contractor_id uuid references public.users(id) on delete cascade not null,
  
  invoice_number text unique not null,
  
  items jsonb not null default '[]',
  subtotal numeric(10,2) default 0,
  tax numeric(10,2) default 0,
  total numeric(10,2) default 0,
  
  status text default 'issued' check (status in ('issued','paid','cancelled','overdue')),
  
  due_date timestamptz,
  paid_at timestamptz,
  
  notes text
);

alter table public.invoices enable row level security;

create policy "Shop manages own invoices"
  on public.invoices for all
  using (auth.uid() = shop_id);

create policy "Contractor views own invoices"
  on public.invoices for select
  using (auth.uid() = contractor_id);

create policy "Admins view all invoices"
  on public.invoices for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Auto-generate invoice number
create or replace function generate_invoice_number() returns trigger as $$
begin
  new.invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(new.id::text, 1, 8);
  return new;
end;
$$ language plpgsql;

create trigger invoice_number_trigger before insert
  on public.invoices for each row execute function generate_invoice_number();

-- =============================================
-- DISPUTES
-- =============================================
drop table if exists public.disputes cascade;

create table public.disputes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  requisition_id uuid references public.requisitions(id) on delete cascade not null,
  raised_by uuid references public.users(id) on delete cascade not null,
  
  reason text not null,
  description text,
  evidence jsonb default '[]', -- Array of file URLs
  
  status text default 'open' check (status in ('open','investigating','resolved','dismissed')),
  
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid references public.users(id) on delete set null,
  
  admin_notes text
);

alter table public.disputes enable row level security;

create policy "Users raise disputes"
  on public.disputes for insert
  with check (auth.uid() = raised_by);

create policy "Users view own disputes"
  on public.disputes for select
  using (auth.uid() = raised_by);

create policy "Admins manage disputes"
  on public.disputes for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =============================================
-- AUDIT LOGS
-- =============================================
drop table if exists public.audit_logs cascade;

create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  
  actor_id uuid references public.users(id) on delete set null,
  actor_email text,
  actor_role text,
  
  action text not null,
  entity text not null,
  entity_id text,
  
  details jsonb default '{}',
  ip_address inet,
  user_agent text
);

alter table public.audit_logs enable row level security;

create policy "Admins view audit logs"
  on public.audit_logs for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Service role inserts audit logs"
  on public.audit_logs for insert
  with check (true);

-- Index for faster queries
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity, entity_id, created_at desc);

-- =============================================
-- PLATFORM SETTINGS
-- =============================================
create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  key text unique not null,
  value jsonb not null,
  description text,
  
  updated_by uuid references public.users(id) on delete set null
);

alter table public.settings enable row level security;

create policy "All authenticated can view settings"
  on public.settings for select
  using (auth.role() = 'authenticated');

create policy "Admins manage settings"
  on public.settings for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Insert default settings
insert into public.settings (key, value, description) values
  ('approval_threshold', '5000', 'Requisition approval threshold in Kina'),
  ('enable_chat', 'true', 'Enable chat feature'),
  ('enable_reviews', 'true', 'Enable reviews feature'),
  ('enable_registration', 'true', 'Allow new user registration'),
  ('currency', '{"code": "PGK", "symbol": "K", "name": "Papua New Guinea Kina"}', 'Platform currency'),
  ('low_stock_threshold', '10', 'Default low stock alert threshold')
on conflict (key) do nothing;

-- =============================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- =============================================
-- Create storage buckets for:
-- 1. avatars (public)
-- 2. products (public)
-- 3. attachments (private)
-- 4. invoices (private)
-- 5. disputes (private)

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to check low stock and create notifications
create or replace function check_low_stock() returns trigger as $$
declare
  threshold integer;
begin
  select (value::text)::integer into threshold from public.settings where key = 'low_stock_threshold';
  
  if new.stock <= coalesce(new.low_stock_threshold, threshold) and (old.stock is null or old.stock > coalesce(new.low_stock_threshold, threshold)) then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.shop_id,
      'low_stock',
      'Low Stock Alert',
      'Product "' || new.name || '" is running low on stock (' || new.stock || ' remaining)',
      jsonb_build_object('product_id', new.id, 'stock', new.stock)
    );
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger low_stock_trigger after insert or update of stock
  on public.products for each row execute function check_low_stock();

-- Function to update requisition total
create or replace function update_requisition_total() returns trigger as $$
declare
  total numeric(10,2);
  threshold numeric(10,2);
begin
  -- Calculate total from items
  select coalesce(sum((item->>'total')::numeric), 0)
  into total
  from jsonb_array_elements(new.items) as item;
  
  new.total_amount := total;
  
  -- Check if approval required
  select (value::text)::numeric into threshold from public.settings where key = 'approval_threshold';
  new.requires_approval := total > threshold;
  
  return new;
end;
$$ language plpgsql;

create trigger requisition_total_trigger before insert or update of items
  on public.requisitions for each row execute function update_requisition_total();

-- =============================================
-- VIEWS FOR ANALYTICS
-- =============================================

-- Shop ratings view
create or replace view shop_ratings as
select 
  u.id as shop_id,
  u.business_name,
  count(r.id) as total_reviews,
  avg(r.rating)::numeric(3,2) as average_rating
from public.users u
left join public.reviews r on r.reviewee_id = u.id
where u.role = 'hardware_shop'
group by u.id, u.business_name;

-- Contractor spending view
create or replace view contractor_spending as
select 
  contractor_id,
  count(*) as total_requisitions,
  sum(total_amount) as total_spent,
  avg(total_amount) as average_order
from public.requisitions
where status = 'fulfilled'
group by contractor_id;

-- Shop sales view
create or replace view shop_sales as
select 
  assigned_shop_id as shop_id,
  count(*) as total_orders,
  sum(total_amount) as total_revenue,
  avg(total_amount) as average_order
from public.requisitions
where status = 'fulfilled' and assigned_shop_id is not null
group by assigned_shop_id;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
create index if not exists requisitions_contractor_idx on public.requisitions(contractor_id, created_at desc);
create index if not exists requisitions_shop_idx on public.requisitions(assigned_shop_id, created_at desc);
create index if not exists requisitions_status_idx on public.requisitions(status, created_at desc);
create index if not exists products_shop_idx on public.products(shop_id, active);
create index if not exists products_category_idx on public.products(category_id, active);
create index if not exists reviews_reviewee_idx on public.reviews(reviewee_id);
create index if not exists invoices_contractor_idx on public.invoices(contractor_id, created_at desc);
create index if not exists invoices_shop_idx on public.invoices(shop_id, created_at desc);

-- =============================================
-- COMPLETED
-- =============================================
-- Run this entire script in Supabase SQL Editor
-- Then configure storage buckets in Supabase Dashboard

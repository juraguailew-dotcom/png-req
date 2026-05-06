-- =============================================
-- PNG Requisition System - Migration V2
-- Run this in Supabase SQL Editor
-- =============================================

-- PRODUCTS / CATALOGUE
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  name text not null,
  description text,
  unit text default 'unit',
  price numeric(10,2) default 0,
  stock integer default 0,
  category text default 'General',
  shop_id uuid references auth.users(id) on delete cascade not null
);
alter table public.products enable row level security;
create policy "Shop manages own products" on public.products for all using (auth.uid() = shop_id);
create policy "All authenticated can view products" on public.products for select using (auth.role() = 'authenticated');

-- TEMPLATES
create table if not exists public.templates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  items jsonb not null default '[]'
);
alter table public.templates enable row level security;
create policy "Users manage own templates" on public.templates for all using (auth.uid() = user_id);

-- FAVOURITES
create table if not exists public.favourites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  unique(user_id, product_id)
);
alter table public.favourites enable row level security;
create policy "Users manage own favourites" on public.favourites for all using (auth.uid() = user_id);

-- MESSAGES
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  read boolean default false not null,
  requisition_id uuid references public.requisitions(id) on delete set null
);
alter table public.messages enable row level security;
create policy "Users can view own messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can mark messages read" on public.messages for update using (auth.uid() = receiver_id);

-- INVOICES
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  requisition_id uuid references public.requisitions(id) on delete cascade not null,
  shop_id uuid references auth.users(id) on delete cascade not null,
  contractor_id uuid references auth.users(id) on delete cascade not null,
  items jsonb not null default '[]',
  total numeric(10,2) default 0,
  status text default 'Issued' check (status in ('Issued','Paid','Cancelled')),
  notes text
);
alter table public.invoices enable row level security;
create policy "Shop manages own invoices" on public.invoices for all using (auth.uid() = shop_id);
create policy "Contractor views own invoices" on public.invoices for select using (auth.uid() = contractor_id);
create policy "Admins view all invoices" on public.invoices for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- REVIEWS
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  requisition_id uuid references public.requisitions(id) on delete cascade not null,
  reviewer_id uuid references auth.users(id) on delete cascade not null,
  shop_id uuid references auth.users(id) on delete cascade not null,
  rating integer check (rating between 1 and 5) not null,
  comment text,
  unique(requisition_id, reviewer_id)
);
alter table public.reviews enable row level security;
create policy "Users can write reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);
create policy "All authenticated can read reviews" on public.reviews for select using (auth.role() = 'authenticated');

-- DISPUTES
create table if not exists public.disputes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  requisition_id uuid references public.requisitions(id) on delete cascade not null,
  raised_by uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  status text default 'Open' check (status in ('Open','Resolved','Dismissed')),
  resolution text,
  resolved_at timestamptz,
  resolved_by text
);
alter table public.disputes enable row level security;
create policy "Users can raise disputes" on public.disputes for insert with check (auth.uid() = raised_by);
create policy "Users can view own disputes" on public.disputes for select using (auth.uid() = raised_by);
create policy "Admins manage disputes" on public.disputes for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb
);
alter table public.audit_logs enable row level security;
create policy "Admins view audit logs" on public.audit_logs for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Service role inserts audit logs" on public.audit_logs for insert with check (true);

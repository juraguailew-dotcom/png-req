-- Add new columns to requisitions
alter table public.requisitions
  add column if not exists comment text,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists fulfilled_by text,
  add column if not exists assigned_shop_id uuid references auth.users(id) on delete set null,
  add column if not exists assigned_shop_name text;

-- Update status check to include Fulfilled
alter table public.requisitions
  drop constraint if exists requisitions_status_check;
alter table public.requisitions
  add constraint requisitions_status_check
  check (status in ('Pending', 'Approved', 'Rejected', 'Fulfilled'));

-- Notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  read boolean default false not null,
  requisition_id uuid references public.requisitions(id) on delete cascade
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Hardware shop: view requisitions assigned to them
create policy "Shop can view assigned requisitions"
  on public.requisitions for select
  using (auth.uid() = assigned_shop_id);

-- Hardware shop: update assigned requisitions (to mark fulfilled + add comment)
create policy "Shop can update assigned requisitions"
  on public.requisitions for update
  using (auth.uid() = assigned_shop_id);

-- Service role inserts notifications (via API routes) — no RLS needed for insert from server
-- But allow admin to insert notifications
create policy "Admins can insert notifications"
  on public.notifications for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Fix existing admin policies to use app_metadata instead of user_metadata
drop policy if exists "Admins can view all requests" on public.requisitions;
drop policy if exists "Admins can update all requests" on public.requisitions;

create policy "Admins can view all requests"
  on public.requisitions for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update all requests"
  on public.requisitions for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

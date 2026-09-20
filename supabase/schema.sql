-- =======================================================
-- BRUTAL CASH - Supabase Cloud Sync Schema
-- Run this in your Supabase Project: SQL Editor -> New Query
-- =======================================================

-- 1. Create transactions table
create table if not exists public.transactions (
  id text primary key,
  type text not null,
  amount numeric not null,
  title text not null,
  category text not null,
  account text not null,
  note text,
  date text not null,
  "createdAt" text not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.transactions enable row level security;

-- 3. Create RLS Policy to allow anon public key read/write access
create policy if not exists "Allow anon full access to transactions"
on public.transactions
for all
to anon
using (true)
with check (true);

-- 4. Create index for faster querying by date and createdAt
create index if not exists idx_transactions_date on public.transactions(date desc);
create index if not exists idx_transactions_created_at on public.transactions("createdAt" desc);

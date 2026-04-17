create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  result_data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_name text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'solved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating int not null check (rating between 1 and 5),
  testimony text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_results_user_id_created_at
  on public.saved_results(user_id, created_at desc);

create index if not exists idx_reports_user_id_created_at
  on public.reports(user_id, created_at desc);

create index if not exists idx_reports_status_created_at
  on public.reports(status, created_at desc);

create index if not exists idx_testimonials_created_at
  on public.testimonials(created_at desc);

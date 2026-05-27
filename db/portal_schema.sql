-- ─────────────────────────────────────────────────────────────────────────
-- GoVisa Portal — schema isolado (prefixo portal_). Seguro/aditivo.
-- Roda no Supabase compartilhado do VPS. NUNCA toca tabelas do govisa-system.
-- IDs em text (gerados pelo app). Datas YYYY-MM-DD em text. Timestamps ISO.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists portal_staff (
  id            text primary key,
  email         text unique not null,
  password_hash text not null,
  name          text not null,
  role          text not null default 'case_manager' check (role in ('admin','case_manager')),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists portal_clients (
  id            text primary key,
  full_name     text not null,
  passport      text unique not null,
  date_of_birth text not null,
  email         text,
  phone         text,
  whatsapp      text,
  case_type     text,
  assigned_to   text references portal_staff(id) on delete set null,
  status        text not null default 'active' check (status in ('active','paused','closed')),
  created_at    timestamptz not null default now(),
  stages        jsonb not null default '[]'::jsonb
);
create index if not exists portal_clients_assigned_idx on portal_clients(assigned_to);
create index if not exists portal_clients_passport_idx on portal_clients(lower(passport));

create table if not exists portal_case_events (
  id                text primary key,
  client_id         text not null references portal_clients(id) on delete cascade,
  stage_key         text,
  type              text not null,
  text              text not null,
  author            text not null,
  created_at        timestamptz not null default now(),
  visible_to_client boolean not null default true,
  notified          boolean not null default false
);
create index if not exists portal_case_events_client_idx on portal_case_events(client_id);

create table if not exists portal_deadlines (
  id        text primary key,
  client_id text not null references portal_clients(id) on delete cascade,
  title     text not null,
  due_date  text not null,
  status    text not null default 'pending' check (status in ('pending','done')),
  stage_key text
);
create index if not exists portal_deadlines_client_idx on portal_deadlines(client_id);

create table if not exists portal_office (
  id             int primary key default 1,
  office_name    text not null,
  attorney       text not null,
  phone          text not null,
  whatsapp       text not null,
  email          text not null,
  address_line   text,
  disclaimer_text text not null,
  constraint portal_office_singleton check (id = 1)
);

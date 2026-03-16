-- Common DAWN SERIES schema
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  user_id uuid not null,
  name text not null,
  role text default 'member',
  created_at timestamptz default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  email text,
  phone text,
  internal_id text,
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

-- DAWN FORM specific tables
create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  title text not null,
  description text,
  fields jsonb not null default '[]',
  is_active boolean default true,
  public_token text unique default gen_random_uuid()::text,
  created_at timestamptz default now()
);

create table if not exists form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references forms(id),
  contact_id uuid references contacts(id),
  responses jsonb not null,
  ip_address text,
  submitted_at timestamptz default now()
);

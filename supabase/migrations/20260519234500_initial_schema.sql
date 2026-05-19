-- CRM-X initial Supabase/PostgreSQL schema.
-- This migration prepares the database for multi-company CRM data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan_code text not null default 'pilot',
  subscription_status text not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Новый пользователь'),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.organization_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_code text not null check (role_code in ('manager', 'leader', 'vip')),
  status text not null default 'active' check (status in ('active', 'invited', 'blocked')),
  leader_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  name text not null,
  segment text,
  industry text,
  city text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  owner_id uuid references public.profiles(id),
  full_name text not null,
  role_title text,
  phone text,
  email text,
  gender text,
  birth_date date,
  interests text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.profiles(id),
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  need text,
  status text not null default 'new' check (status in ('new', 'qualified', 'disqualified')),
  disqualification_reason text check (
    disqualification_reason is null
    or disqualification_reason in ('Дорого', 'Не подошел функционал', 'Ошибочный интерес')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.profiles(id),
  title text not null,
  status text not null default 'new' check (status in ('new', 'contact', 'offer', 'won', 'lost')),
  value numeric(14, 2) not null default 0 check (value >= 0),
  cost numeric(14, 2) not null default 0 check (cost >= 0),
  source text,
  close_date date,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku text,
  name text not null,
  category text,
  purchase_cost numeric(14, 2) not null default 0 check (purchase_cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);

create table public.product_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  batch_code text,
  serial_number text not null,
  purchase_cost numeric(14, 2) not null default 0 check (purchase_cost >= 0),
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  purchased_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, serial_number)
);

create table public.deal_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_unit_id uuid references public.product_units(id) on delete restrict,
  product_name text not null,
  product_category text,
  quantity numeric(14, 3) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'waiting', 'done', 'overdue')),
  due_at timestamptz,
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope text not null check (scope in ('company', 'manager')),
  user_id uuid references public.profiles(id),
  period_start date not null,
  period_end date not null,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope = 'company' and user_id is null) or (scope = 'manager' and user_id is not null))
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  channel text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  spend numeric(14, 2) not null default 0 check (spend >= 0),
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  owner_id uuid references public.profiles(id),
  topic text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  nps_score integer check (nps_score between 0 and 10),
  csat_score integer check (csat_score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  entity_table text not null,
  entity_id uuid not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index companies_organization_idx on public.companies(organization_id);
create index contacts_organization_idx on public.contacts(organization_id);
create index contacts_company_idx on public.contacts(company_id);
create index leads_organization_status_idx on public.leads(organization_id, status);
create index deals_organization_status_idx on public.deals(organization_id, status);
create index deals_company_idx on public.deals(company_id);
create index deal_items_deal_idx on public.deal_items(deal_id);
create index product_units_product_status_idx on public.product_units(product_id, status);
create index tasks_owner_status_due_idx on public.tasks(owner_id, status, due_at);
create index sales_plans_organization_period_idx on public.sales_plans(organization_id, period_start, period_end);

create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organization_users_updated_at before update on public.organization_users for each row execute function public.set_updated_at();
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger deals_updated_at before update on public.deals for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_units_updated_at before update on public.product_units for each row execute function public.set_updated_at();
create trigger deal_items_updated_at before update on public.deal_items for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger sales_plans_updated_at before update on public.sales_plans for each row execute function public.set_updated_at();
create trigger campaigns_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger tickets_updated_at before update on public.tickets for each row execute function public.set_updated_at();

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_users ou
    where ou.organization_id = target_organization_id
      and ou.user_id = auth.uid()
      and ou.status = 'active'
  );
$$;

create or replace function public.is_org_leader(target_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_users ou
    where ou.organization_id = target_organization_id
      and ou.user_id = auth.uid()
      and ou.status = 'active'
      and ou.role_code in ('leader', 'vip')
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_users enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.products enable row level security;
alter table public.product_units enable row level security;
alter table public.deal_items enable row level security;
alter table public.tasks enable row level security;
alter table public.sales_plans enable row level security;
alter table public.campaigns enable row level security;
alter table public.tickets enable row level security;
alter table public.audit_events enable row level security;

create policy "members read organizations"
on public.organizations for select
using (public.is_org_member(id));

create policy "users read own profile"
on public.profiles for select
using (id = auth.uid());

create policy "users insert own profile"
on public.profiles for insert
with check (id = auth.uid());

create policy "users update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "members read organization users"
on public.organization_users for select
using (public.is_org_member(organization_id));

create policy "leaders manage organization users"
on public.organization_users for all
using (public.is_org_leader(organization_id))
with check (public.is_org_leader(organization_id));

create policy "members read companies"
on public.companies for select
using (public.is_org_member(organization_id));

create policy "members write companies"
on public.companies for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members read contacts"
on public.contacts for select
using (public.is_org_member(organization_id));

create policy "members write contacts"
on public.contacts for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members read leads"
on public.leads for select
using (public.is_org_member(organization_id));

create policy "members write leads"
on public.leads for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members read deals"
on public.deals for select
using (public.is_org_member(organization_id));

create policy "members write deals"
on public.deals for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members read products"
on public.products for select
using (public.is_org_member(organization_id));

create policy "leaders write products"
on public.products for all
using (public.is_org_leader(organization_id))
with check (public.is_org_leader(organization_id));

create policy "members read product units"
on public.product_units for select
using (public.is_org_member(organization_id));

create policy "leaders write product units"
on public.product_units for all
using (public.is_org_leader(organization_id))
with check (public.is_org_leader(organization_id));

create policy "members read deal items"
on public.deal_items for select
using (public.is_org_member(organization_id));

create policy "members write deal items"
on public.deal_items for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members read tasks"
on public.tasks for select
using (public.is_org_member(organization_id));

create policy "members write tasks"
on public.tasks for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members read sales plans"
on public.sales_plans for select
using (public.is_org_member(organization_id));

create policy "leaders write sales plans"
on public.sales_plans for all
using (public.is_org_leader(organization_id))
with check (public.is_org_leader(organization_id));

create policy "members read campaigns"
on public.campaigns for select
using (public.is_org_member(organization_id));

create policy "leaders write campaigns"
on public.campaigns for all
using (public.is_org_leader(organization_id))
with check (public.is_org_leader(organization_id));

create policy "members read tickets"
on public.tickets for select
using (public.is_org_member(organization_id));

create policy "members write tickets"
on public.tickets for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "leaders read audit events"
on public.audit_events for select
using (public.is_org_leader(organization_id));

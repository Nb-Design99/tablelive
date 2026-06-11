-- =====================================================================
-- Courtio — Schéma de base de données (PostgreSQL / Supabase)
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor).
-- Crée les tables, la sécurité (RLS) et le calcul automatique des commissions.
-- =====================================================================

-- ---------- Types ----------
do $$ begin
  create type user_role as enum ('entreprise', 'apporteur');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reward_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status as enum ('nouveau', 'devis_envoye', 'signe', 'paye');
exception when duplicate_object then null; end $$;

-- ---------- Profils (extension de auth.users) ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null,
  full_name     text,
  company_name  text,
  sector        text,
  canton        text,
  -- Identifiants Stripe
  stripe_customer_id   text,           -- abonnement (entreprise)
  stripe_connect_id    text,           -- compte de versement (apporteur)
  connect_ready        boolean default false,  -- onboarding Connect terminé
  subscription_status  text default 'inactive', -- active / inactive / trialing
  created_at    timestamptz default now()
);

-- ---------- Missions (publiées par les entreprises) ----------
create table if not exists public.missions (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  sector        text,
  description   text,
  reward_type   reward_type not null default 'percent',
  reward_value  numeric not null check (reward_value >= 0),
  active        boolean default true,
  created_at    timestamptz default now()
);

-- ---------- Leads (clients apportés) ----------
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  mission_id      uuid not null references public.missions(id) on delete cascade,
  company_id      uuid not null references public.profiles(id) on delete cascade,
  apporteur_id    uuid not null references public.profiles(id) on delete cascade,
  client_name     text not null,
  client_need     text,
  estimated_value numeric default 0,
  quote_amount    numeric default 0,           -- montant du devis (rempli par l'entreprise)
  status          lead_status not null default 'nouveau',
  commission_amount numeric default 0,          -- calculé à la signature
  created_at      timestamptz default now()
);

-- ---------- Historique de statut ----------
create table if not exists public.lead_events (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  status      lead_status not null,
  note        text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);

-- ---------- Paiements de commission ----------
create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  lead_id            uuid not null references public.leads(id) on delete cascade,
  apporteur_id       uuid not null references public.profiles(id),
  amount             numeric not null,
  stripe_transfer_id text,
  status             text default 'pending',   -- pending / paid / failed
  created_at         timestamptz default now()
);

-- =====================================================================
-- Calcul automatique de la commission au passage en "signe"
-- =====================================================================
create or replace function public.compute_commission()
returns trigger as $$
declare
  m record;
begin
  if new.status = 'signe' and (old.status is distinct from 'signe') then
    select reward_type, reward_value into m from public.missions where id = new.mission_id;
    if m.reward_type = 'fixed' then
      new.commission_amount := m.reward_value;
    else
      new.commission_amount := round(coalesce(new.quote_amount, 0) * m.reward_value / 100.0);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_compute_commission on public.leads;
create trigger trg_compute_commission
  before update on public.leads
  for each row execute function public.compute_commission();

-- Journalise chaque changement de statut
create or replace function public.log_lead_event()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into public.lead_events(lead_id, status, created_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_lead_event on public.leads;
create trigger trg_log_lead_event
  after insert or update on public.leads
  for each row execute function public.log_lead_event();

-- =====================================================================
-- Création automatique du profil à l'inscription
-- (les métadonnées role/full_name viennent du signUp côté frontend)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, company_name, sector, canton)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'apporteur'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'sector',
    new.raw_user_meta_data->>'canton'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Sécurité au niveau des lignes (Row Level Security)
-- =====================================================================
alter table public.profiles  enable row level security;
alter table public.missions  enable row level security;
alter table public.leads     enable row level security;
alter table public.lead_events enable row level security;
alter table public.payments  enable row level security;

-- Profils : chacun lit/modifie le sien ; lecture publique limitée (nom d'entreprise visible dans la marketplace)
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_public_company" on public.profiles;
create policy "profiles_public_company" on public.profiles for select
  using (role = 'entreprise');
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

-- Missions : l'entreprise gère les siennes ; tout utilisateur connecté voit les missions actives
drop policy if exists "missions_read_active" on public.missions;
create policy "missions_read_active" on public.missions for select
  using (active = true or company_id = auth.uid());
drop policy if exists "missions_company_write" on public.missions;
create policy "missions_company_write" on public.missions for all
  using (company_id = auth.uid()) with check (company_id = auth.uid());

-- Leads : l'apporteur crée/voit les siens ; l'entreprise voit/maj ceux de ses missions
drop policy if exists "leads_apporteur_insert" on public.leads;
create policy "leads_apporteur_insert" on public.leads for insert
  with check (apporteur_id = auth.uid());
drop policy if exists "leads_read_involved" on public.leads;
create policy "leads_read_involved" on public.leads for select
  using (apporteur_id = auth.uid() or company_id = auth.uid());
drop policy if exists "leads_company_update" on public.leads;
create policy "leads_company_update" on public.leads for update
  using (company_id = auth.uid());

-- Événements & paiements : lecture pour les parties concernées
drop policy if exists "events_read_involved" on public.lead_events;
create policy "events_read_involved" on public.lead_events for select
  using (exists (select 1 from public.leads l where l.id = lead_id
                 and (l.apporteur_id = auth.uid() or l.company_id = auth.uid())));
drop policy if exists "payments_read_involved" on public.payments;
create policy "payments_read_involved" on public.payments for select
  using (apporteur_id = auth.uid()
         or exists (select 1 from public.leads l where l.id = lead_id and l.company_id = auth.uid()));

-- Index utiles
create index if not exists idx_leads_company on public.leads(company_id);
create index if not exists idx_leads_apporteur on public.leads(apporteur_id);
create index if not exists idx_missions_company on public.missions(company_id);
create index if not exists idx_missions_active on public.missions(active);

-- Fin du schéma.

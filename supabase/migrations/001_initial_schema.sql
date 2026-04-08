-- SimTest: Schema-Migration
-- Nutzt bestehende profiles-Tabelle, ergaenzt SimTest-Spalten

-- SimTest-Spalten zu profiles hinzufuegen (falls nicht vorhanden)
alter table profiles add column if not exists plan text default 'free';
alter table profiles add column if not exists runs_used integer default 0;
alter table profiles add column if not exists runs_limit integer default 3;
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;

-- Persona-Profile
create table if not exists persona_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text not null,
  demographics text,
  psychographics text,
  context text,
  agent_count_default integer not null default 50,
  personas jsonb,
  created_at timestamptz not null default now()
);

alter table persona_profiles enable row level security;
do $$ begin
  create policy "Users can CRUD own personas" on persona_profiles
    for all using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Simulations-Runs
create table if not exists runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  persona_profile_id uuid references persona_profiles(id) on delete set null,
  stimulus_type text not null check (stimulus_type in ('copy', 'product', 'strategy')),
  stimulus_variants jsonb not null default '[]',
  agent_count integer not null default 50,
  context_layer jsonb,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table runs enable row level security;
do $$ begin
  create policy "Users can CRUD own runs" on runs
    for all using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Reports
create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  run_id uuid references runs(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  winner_index integer,
  summary text,
  segment_breakdown jsonb,
  improvement_suggestions jsonb,
  raw_reactions jsonb,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;
do $$ begin
  create policy "Users can read own reports" on reports
    for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Usage Events
create table if not exists usage_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  run_id uuid references runs(id) on delete set null,
  extra_runs integer not null default 0,
  billed_amount numeric(10,2),
  created_at timestamptz not null default now()
);

alter table usage_events enable row level security;
do $$ begin
  create policy "Users can read own usage" on usage_events
    for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Indizes
create index if not exists idx_runs_user_id on runs(user_id);
create index if not exists idx_runs_status on runs(status);
create index if not exists idx_reports_run_id on reports(run_id);
create index if not exists idx_persona_profiles_user_id on persona_profiles(user_id);

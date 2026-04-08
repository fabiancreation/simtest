-- Waitlist: E-Mail-Adressen von der Landing Page speichern
create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_unique unique (email)
);

-- Kein RLS nötig — Insert erfolgt über Service Role Key in der API-Route
-- Select nur für Admin (kein öffentlicher Zugriff)
alter table waitlist enable row level security;

-- Anon-User dürfen inserten (Landing Page ohne Login)
do $$ begin
  create policy "Anyone can join waitlist" on waitlist
    for insert with check (true);
exception when duplicate_object then null;
end $$;

-- Monatlicher Reset von runs_used auf 0 für alle Nutzer
-- Läuft am 1. jedes Monats um 00:00 UTC

-- pg_cron Extension aktivieren (falls noch nicht)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Cron-Job: runs_used jeden Monat zurücksetzen
SELECT cron.schedule(
  'monthly-runs-reset',
  '0 0 1 * *',
  $$UPDATE public.profiles SET runs_used = 0 WHERE runs_used > 0$$
);

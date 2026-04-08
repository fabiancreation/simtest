-- Eigene Plan-Spalte für SimTest (getrennt von Funnel Architect)
-- profiles.plan bleibt für Funnel Architect (free/builder/strategist)
-- profiles.simtest_plan ist für SimTest (free/starter/pro/business)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS simtest_plan text NOT NULL DEFAULT 'free'
  CHECK (simtest_plan = ANY (ARRAY['free', 'starter', 'pro', 'business']));

-- Runs-Felder existieren bereits (aus 001), gehören zu SimTest
-- runs_used, runs_limit bleiben wie sie sind

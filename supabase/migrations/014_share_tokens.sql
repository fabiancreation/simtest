-- Report Sharing: öffentliche Links für Simulationsberichte
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT NULL;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_simulations_share_token
  ON simulations(share_token) WHERE share_token IS NOT NULL;

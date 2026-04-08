-- SimTest v2: Erweiterte Simulationen (7 Typen, JSONB-Input, Dateien)

-- Neue simulations-Tabelle (ersetzt runs für neue Simulationen)
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Typ & Config
  sim_type TEXT NOT NULL CHECK (sim_type IN ('copy', 'product', 'pricing', 'ad', 'landing', 'campaign', 'crisis')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'running', 'completed', 'failed')),

  -- Persona
  persona_preset TEXT,
  persona_id UUID REFERENCES persona_profiles(id) ON DELETE SET NULL,
  agent_count INTEGER NOT NULL DEFAULT 200,

  -- Typ-spezifische Daten (flexibles JSONB)
  input_data JSONB NOT NULL DEFAULT '{}',

  -- Simulation Config
  sim_depth TEXT NOT NULL DEFAULT 'balanced' CHECK (sim_depth IN ('fast', 'balanced', 'deep')),

  -- Kosten & Timing
  estimated_cost DECIMAL(10, 6),
  actual_cost DECIMAL(10, 6),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Ergebnisse
  result_data JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can CRUD own simulations" ON simulations
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);

-- Dateien für Simulationen (Ad-Bilder, Produktbilder, Kampagnen-Assets)
CREATE TABLE IF NOT EXISTS simulation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE NOT NULL,

  file_type TEXT NOT NULL CHECK (file_type IN ('ad_image', 'product_image', 'campaign_asset', 'other')),
  variant_index INTEGER,

  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE simulation_files ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage own simulation files" ON simulation_files
    FOR ALL USING (
      EXISTS (SELECT 1 FROM simulations WHERE simulations.id = simulation_files.simulation_id AND simulations.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

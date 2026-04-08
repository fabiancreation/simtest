-- Neue Engine: Agenten und Reaktionen als separate Tabellen

-- Generierte Agenten pro Simulation
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE NOT NULL,
  agent_index INTEGER NOT NULL,
  persona JSONB NOT NULL,
  system_prompt TEXT NOT NULL,
  assigned_variant TEXT NOT NULL,
  network_connections INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can read own agents" ON agents
    FOR ALL USING (
      EXISTS (SELECT 1 FROM simulations WHERE simulations.id = agents.simulation_id AND simulations.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_agents_simulation ON agents(simulation_id);

-- Reaktionen pro Agent pro Runde
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE NOT NULL,
  agent_index INTEGER NOT NULL,
  round INTEGER NOT NULL,
  variant_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'comment', 'share', 'ignore')),
  comment_text TEXT,
  internal_reasoning TEXT,
  interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 10),
  credibility_rating INTEGER CHECK (credibility_rating BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can read own reactions" ON reactions
    FOR ALL USING (
      EXISTS (SELECT 1 FROM simulations WHERE simulations.id = reactions.simulation_id AND simulations.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_reactions_simulation ON reactions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_reactions_round ON reactions(simulation_id, round);

-- Runden-Anzahl auf simulations
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 1;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 0;

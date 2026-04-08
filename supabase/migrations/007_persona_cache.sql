-- P4: Persona-Cache — gleiche Zielgruppe = gleiche Personas
CREATE TABLE IF NOT EXISTS persona_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description_hash TEXT NOT NULL,
  agent_count INTEGER NOT NULL,
  personas JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE persona_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can read own persona cache" ON persona_cache
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_persona_cache_lookup
  ON persona_cache(user_id, description_hash, agent_count);

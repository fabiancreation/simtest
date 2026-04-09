-- Persona-Pool: Cache ist jetzt pro (user_id, description_hash), nicht mehr pro agent_count
-- Ermöglicht einen Pool von z.B. 200 Personas, aus dem pro Simulation gesamplet wird

-- Alten Index/Constraint entfernen
DROP INDEX IF EXISTS idx_persona_cache_lookup;

-- Neuen Unique-Constraint ohne agent_count
CREATE UNIQUE INDEX idx_persona_cache_lookup ON persona_cache(user_id, description_hash);

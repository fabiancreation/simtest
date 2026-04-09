-- Priorität für Persona-Profile: primary, secondary, niche oder null
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT NULL
  CHECK (priority IS NULL OR priority IN ('primary', 'secondary', 'niche'));

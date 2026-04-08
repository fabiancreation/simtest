-- Persona Builder v2: Erweiterte Persona-Tabelle mit AI-Enrichment
-- Erweitert persona_profiles um strukturierte Felder + AI-Tracking

-- Neue Spalten für persona_profiles
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS preset_id TEXT;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS age_min INTEGER DEFAULT 25;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS age_max INTEGER DEFAULT 45;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS gender_male INTEGER DEFAULT 48;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS gender_female INTEGER DEFAULT 48;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS gender_diverse INTEGER DEFAULT 4;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS regions TEXT[] DEFAULT '{"deutschland"}';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS urban_rural TEXT DEFAULT 'mixed';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS education TEXT[] DEFAULT '{}';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS income_min INTEGER DEFAULT 2000;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS income_max INTEGER DEFAULT 5000;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS buying_style TEXT DEFAULT 'considered';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS core_values TEXT[] DEFAULT '{}';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS pain_points TEXT[] DEFAULT '{}';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS media_consumption TEXT[] DEFAULT '{}';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS tech_affinity INTEGER DEFAULT 60;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS price_sensitivity INTEGER DEFAULT 50;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS ai_estimated_fields TEXT[] DEFAULT '{}';
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS ai_confidence INTEGER;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
ALTER TABLE persona_profiles ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

-- Fehlende Felder in reactions: would_buy und biggest_objection
-- Diese Daten wurden bisher nur im Memory gehalten und gingen nach der Simulation verloren

ALTER TABLE reactions ADD COLUMN IF NOT EXISTS would_buy BOOLEAN DEFAULT false;
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS biggest_objection TEXT;

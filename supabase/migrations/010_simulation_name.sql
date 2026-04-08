-- Report-Name für schnelle Übersicht im Dashboard
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS name TEXT;

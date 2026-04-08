-- P3: Fehlermeldung bei fehlgeschlagenen Simulationen speichern
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS error_message TEXT;

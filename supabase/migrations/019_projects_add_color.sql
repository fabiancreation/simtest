-- Fix: color-Spalte fehlte weil Tabelle schon vor Migration 017 existierte
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#6ee7b7';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

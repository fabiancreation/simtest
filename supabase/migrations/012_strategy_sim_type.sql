-- Neuer SimType: strategy (Business-Strategie)
ALTER TABLE simulations DROP CONSTRAINT simulations_sim_type_check;
ALTER TABLE simulations ADD CONSTRAINT simulations_sim_type_check
  CHECK (sim_type = ANY (ARRAY['copy', 'product', 'pricing', 'ad', 'landing', 'campaign', 'crisis', 'strategy']));

export type StimulusType = "copy" | "product" | "strategy";
export type RunStatus = "queued" | "running" | "done" | "failed";
export type PlanTier = "free" | "starter" | "pro" | "business";

export interface Persona {
  name: string;
  age: number;
  occupation: string;
  location: string;
  personality: string;
  values: string[];
  pain_points: string[];
  buy_triggers: string[];
  objections: string[];
  media_consumption: string;
}

export interface PersonaProfile {
  id: string;
  user_id: string;
  name: string;
  description: string;
  demographics: string;
  psychographics: string;
  context: string;
  agent_count_default: number;
  created_at: string;
}

export interface Run {
  id: string;
  user_id: string;
  persona_profile_id: string;
  stimulus_type: StimulusType;
  stimulus_variants: string[];
  agent_count: number;
  context_layer: Record<string, unknown> | null;
  status: RunStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Report {
  id: string;
  run_id: string;
  user_id: string;
  winner_index: number;
  summary: string;
  segment_breakdown: Record<string, unknown>;
  improvement_suggestions: string[];
  raw_reactions: Record<string, unknown>;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  plan: PlanTier;
  runs_used: number;
  runs_limit: number;
  created_at: string;
}

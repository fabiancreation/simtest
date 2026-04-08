// --- Simulation Engine Types ---

export type SimAction = "like" | "comment" | "share" | "ignore";

export interface Agent {
  index: number;
  persona: AgentPersona;
  systemPrompt: string;
  assignedVariant: string;
  connections: number[];
}

export interface AgentPersona {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  location: string;
  region_type: string;
  education: string;
  income_monthly: number;
  personality: string;
  big_five: Record<string, number>;
  values: string[];
  pain_points: string[];
  buying_triggers: string[];
  buying_blockers: string[];
  media_primary: string[];
  trust_sources: string[];
  subtype?: string;
  subtype_traits?: string;
}

export interface Reaction {
  agentIndex: number;
  round: number;
  variantId: string;
  action: SimAction;
  commentText: string | null;
  internalReasoning: string;
  interestLevel: number;
  credibilityRating: number;
}

export interface VariantReport {
  variant_id: string;
  label: string;
  total_agents: number;
  engagement_rate: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  ignore_count: number;
  avg_interest: number;
  avg_credibility: number;
  top_comments: Array<{
    agent_name: string;
    text: string;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface PersonaInsight {
  segment: string;
  preferred_variant: string;
  reason: string;
}

export interface RoundSummary {
  round: number;
  actions_per_variant: Record<string, {
    likes: number;
    comments: number;
    shares: number;
    ignores: number;
  }>;
}

export interface SimulationReport {
  variants: VariantReport[];
  winner: string;
  confidence: "low" | "medium" | "high";
  key_insights: string[];
  persona_breakdown: PersonaInsight[];
  round_progression: RoundSummary[];
}

export interface Variant {
  id: string;
  label: string;
  content: string;
}

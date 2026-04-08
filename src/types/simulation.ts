// --- Simulation Types ---

export type SimType = "copy" | "product" | "pricing" | "ad" | "landing" | "campaign" | "crisis";
export type SimDepth = "fast" | "balanced" | "deep";
export type SimStatus = "draft" | "queued" | "running" | "completed" | "failed";

// Legacy compat
export type StimulusType = "copy" | "product" | "strategy";
export type RunStatus = "queued" | "running" | "done" | "failed";

export type PlanTier = "free" | "starter" | "pro" | "business";

// --- Sim Type Config ---

export interface SimTypeConfig {
  id: SimType;
  label: string;
  desc: string;
  color: string;
  icon: string; // SVG path
  needs: string[];
  contextHint: string;
  minVariants?: number;
  maxVariants?: number;
  variantPlaceholder?: string;
}

export const SIM_TYPES: Record<SimType, SimTypeConfig> = {
  copy: {
    id: "copy",
    label: "Copy Testing",
    desc: "Vergleiche Textvarianten",
    color: "#10B981",
    icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z",
    needs: ["variants", "context"],
    contextHint: "Wo wird der Text eingesetzt? (Newsletter-Betreff, Ads, Landing Page...)",
    minVariants: 2,
    maxVariants: 5,
    variantPlaceholder: "z.B. 'Spare 30% auf dein erstes Coaching-Paket'",
  },
  product: {
    id: "product",
    label: "Produkt-Check",
    desc: "Kauf- oder Ablehnungssimulation",
    color: "#6366F1",
    icon: "M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25",
    needs: ["offer", "pricing_single", "context"],
    contextHint: "Gibt es aktuell Wettbewerber oder Marktbedingungen, die relevant sind?",
  },
  pricing: {
    id: "pricing",
    label: "Pricing Test",
    desc: "Preispunkte vergleichen",
    color: "#F59E0B",
    icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    needs: ["offer", "price_variants", "context"],
    contextHint: "Was bieten Wettbewerber zu welchem Preis an?",
    minVariants: 2,
    maxVariants: 5,
  },
  ad: {
    id: "ad",
    label: "Ad Creative",
    desc: "Bilder & Anzeigen testen",
    color: "#EC4899",
    icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z",
    needs: ["ad_variants", "ad_meta", "context"],
    contextHint: "Plattform, Ziel der Kampagne, bisherige Performance...",
    minVariants: 2,
    maxVariants: 4,
  },
  landing: {
    id: "landing",
    label: "Landing Page",
    desc: "URL analysieren lassen",
    color: "#0EA5E9",
    icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
    needs: ["urls", "landing_goal", "context"],
    contextHint: "Was ist das Ziel der Seite? Wer kommt von wo?",
  },
  campaign: {
    id: "campaign",
    label: "Kampagnen-Check",
    desc: "Gesamte Kampagne testen",
    color: "#8B5CF6",
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6",
    needs: ["campaign_brief", "campaign_assets", "context"],
    contextHint: "Budget-Rahmen, Zeitraum, bisherige Erfahrungen...",
  },
  crisis: {
    id: "crisis",
    label: "Krisentest",
    desc: "Community-Reaktion testen",
    color: "#EF4444",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z",
    needs: ["crisis_message", "crisis_meta", "context"],
    contextHint: "Vorgeschichte, aktuelle Stimmung in der Community...",
  },
};

// --- Persona Presets ---

export interface PersonaPreset {
  id: string;
  label: string;
  desc: string;
  icon: string; // SVG path
  agents: number | null;
}

export const PERSONA_PRESETS: PersonaPreset[] = [
  { id: "dach_allgemein", label: "DACH Allgemein", desc: "Breiter Querschnitt 25-55 J.", icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3", agents: 200 },
  { id: "solo_unternehmer", label: "Solo-Unternehmer", desc: "Coaches, Berater, Freelancer", icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0", agents: 150 },
  { id: "ecom_kaeufer", label: "E-Com Käufer", desc: "Online-affin, preisbewusst", icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z", agents: 200 },
  { id: "b2b_entscheider", label: "B2B Entscheider", desc: "KMU-Geschäftsführer, Teamleads", icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21", agents: 100 },
  { id: "gen_z", label: "Gen Z", desc: "18-27 J., digital native", icon: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3", agents: 200 },
  { id: "custom", label: "Eigene Persona", desc: "Selbst konfigurieren", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", agents: null },
];

export const AGENT_COUNTS = [50, 100, 200, 500, 1000] as const;

export const AGENT_COUNT_HINTS: Record<number, string> = {
  50: "Schnell & günstig - gut für erste Richtungstests",
  100: "Schnell & günstig - gut für erste Richtungstests",
  200: "Gute Balance aus Geschwindigkeit und Aussagekraft",
  500: "Detaillierte Ergebnisse mit differenzierten Persona-Segmenten",
  1000: "Maximum: Sehr detailliert, dauert etwas länger",
};

// --- Persona ---

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

// --- Legacy Run types (keep for existing runs) ---

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
  plan: string;
  simtest_plan: PlanTier;
  runs_used: number;
  runs_limit: number;
  created_at: string;
}

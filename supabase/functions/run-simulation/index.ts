import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.85.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

// --- Types ---

interface Persona {
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

interface AgentReaction {
  persona: Persona;
  variantIndex: number;
  reaction: string;
  sentiment: "positiv" | "neutral" | "negativ";
  wouldEngage: boolean;
}

interface VariantStats {
  variantIndex: number;
  totalAgents: number;
  positiv: number;
  neutral: number;
  negativ: number;
  engagementRate: number;
}

// --- Persona Generation ---

async function generatePersonas(description: string, count: number): Promise<Persona[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: `Du generierst KI-Personas für Marktforschungs-Simulationen.
Antworte NUR als JSON-Array. Keine Erklärungen, kein Markdown.
Beginne direkt mit [ und ende mit ].`,
    messages: [{
      role: "user",
      content: `Generiere ${count} realistische deutsche Personas für folgende Zielgruppe:
${description}

Jede Persona als JSON-Objekt mit exakt diesen Feldern:
{
  "name": "Vorname Nachname",
  "age": Zahl,
  "occupation": "Beruf",
  "location": "Stadt, Bundesland",
  "personality": "2-3 Sätze",
  "values": ["Wert1", "Wert2", "Wert3"],
  "pain_points": ["Problem1", "Problem2"],
  "buy_triggers": ["Auslöser1", "Auslöser2"],
  "objections": ["Einwand1", "Einwand2"],
  "media_consumption": "1 Satz"
}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error("Keine Personas generiert");
  return JSON.parse(arrayMatch[0]);
}

// --- Simulation ---

async function getReaction(
  persona: Persona, stimulus: string, stimulusType: string,
  variantIndex: number, contextLayer?: string
): Promise<AgentReaction> {
  const typeLabel = stimulusType === "copy" ? "einen Werbetext"
    : stimulusType === "product" ? "ein Produktangebot"
    : "eine Geschäftsstrategie";

  const prompt = `Du bist ${persona.name}, ${persona.age} Jahre alt, ${persona.occupation} aus ${persona.location}.
Persönlichkeit: ${persona.personality}
Deine Werte: ${persona.values.join(", ")}
Deine größten Probleme: ${persona.pain_points.join(", ")}
Du kaufst wenn: ${persona.buy_triggers.join(", ")}
Deine typischen Einwände: ${persona.objections.join(", ")}

Antworte immer in der ersten Person, authentisch für deine Persona.
${contextLayer ? `\n[KONTEXT: ${contextLayer}]\n` : ""}
Du siehst ${typeLabel}:

"""
${stimulus}
"""

Reagiere ehrlich. Antworte als JSON mit exakt diesen Feldern:
{"reaction": "Deine ehrliche Reaktion in 2-3 Sätzen.", "sentiment": "positiv" oder "neutral" oder "negativ", "wouldEngage": true oder false}

Nur JSON, keine Erklärungen.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { persona, variantIndex, reaction: text.slice(0, 300), sentiment: "neutral", wouldEngage: false };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    persona, variantIndex,
    reaction: parsed.reaction ?? text.slice(0, 300),
    sentiment: parsed.sentiment ?? "neutral",
    wouldEngage: parsed.wouldEngage ?? false,
  };
}

async function runSimulation(
  personas: Persona[], variants: string[], stimulusType: string, contextLayer?: string
) {
  const reactions: AgentReaction[] = [];
  const BATCH_SIZE = 5;
  const tasks: Array<() => Promise<AgentReaction>> = [];

  for (let vi = 0; vi < variants.length; vi++) {
    for (const persona of personas) {
      tasks.push(() => getReaction(persona, variants[vi], stimulusType, vi, contextLayer));
    }
  }

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(fn => fn()));
    for (const result of results) {
      if (result.status === "fulfilled") reactions.push(result.value);
    }
  }

  const variantStats: VariantStats[] = variants.map((_, vi) => {
    const vr = reactions.filter(r => r.variantIndex === vi);
    const total = vr.length;
    return {
      variantIndex: vi, totalAgents: total,
      positiv: vr.filter(r => r.sentiment === "positiv").length,
      neutral: vr.filter(r => r.sentiment === "neutral").length,
      negativ: vr.filter(r => r.sentiment === "negativ").length,
      engagementRate: total > 0 ? vr.filter(r => r.wouldEngage).length / total : 0,
    };
  });

  return { reactions, variantStats };
}

// --- Report Generation ---

async function generateReport(variants: string[], result: { reactions: AgentReaction[]; variantStats: VariantStats[] }) {
  const variantSummaries = result.variantStats.map((vs, i) => {
    const reactions = result.reactions
      .filter(r => r.variantIndex === i)
      .map(r => `- ${r.persona.name} (${r.sentiment}): "${r.reaction}"`)
      .join("\n");
    return `VARIANTE ${i + 1}:\n"""${variants[i]}"""\nPositiv: ${vs.positiv} | Neutral: ${vs.neutral} | Negativ: ${vs.negativ} | Engagement: ${(vs.engagementRate * 100).toFixed(0)}%\n\nReaktionen:\n${reactions}`;
  });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: "Du bist ein Marktforschungs-Analyst. Erstelle präzise, actionable Reports auf Deutsch. Antworte nur als JSON.",
    messages: [{
      role: "user",
      content: `Analysiere die folgenden Simulations-Ergebnisse:\n\n${variantSummaries.join("\n\n---\n\n")}\n\nErstelle einen Report als JSON:\n{"winnerIndex": 0-basiert, "summary": "3-5 Sätze", "topObjections": ["3 häufigste Einwände"], "topPraises": ["3 häufigste positive Punkte"], "improvementSuggestions": ["3-5 Vorschläge"]}\n\nNur JSON.`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Kein JSON in Report");

  const parsed = JSON.parse(jsonMatch[0]);

  // Age segments
  const ranges = [{ label: "18-29", min: 18, max: 29 }, { label: "30-44", min: 30, max: 44 }, { label: "45-59", min: 45, max: 59 }, { label: "60+", min: 60, max: 120 }];
  const engagementByAge = ranges.map(range => {
    const inRange = result.reactions.filter(r => r.persona.age >= range.min && r.persona.age <= range.max);
    if (inRange.length === 0) return null;
    const engaged = inRange.filter(r => r.wouldEngage).length;
    const sentiments = { positiv: 0, neutral: 0, negativ: 0 };
    inRange.forEach(r => sentiments[r.sentiment]++);
    const dominant = Object.entries(sentiments).sort(([, a], [, b]) => b - a)[0][0];
    return { ageRange: range.label, engagementRate: engaged / inRange.length, dominantSentiment: dominant };
  }).filter(Boolean);

  return {
    winnerIndex: parsed.winnerIndex ?? 0,
    summary: parsed.summary ?? "Kein Summary verfügbar.",
    segmentBreakdown: {
      byVariant: result.variantStats,
      topObjections: parsed.topObjections ?? [],
      topPraises: parsed.topPraises ?? [],
      engagementByAge,
    },
    improvementSuggestions: parsed.improvementSuggestions ?? [],
  };
}

// --- Variant Extraction ---

function mapSimType(simType: string): string {
  if (simType === "copy") return "copy";
  if (simType === "product" || simType === "pricing") return "product";
  return "strategy";
}

function extractVariants(simType: string, inputData: Record<string, unknown>): string[] {
  switch (simType) {
    case "copy": return (inputData.variants as string[]) ?? [];
    case "product": {
      const parts = [inputData.offer as string];
      if (inputData.price) parts.push(`Preis: ${inputData.price}`);
      if (inputData.payment_model) parts.push(`Zahlungsmodell: ${inputData.payment_model}`);
      return [parts.filter(Boolean).join("\n\n")];
    }
    case "pricing": {
      const offer = inputData.offer as string ?? "";
      const pvs = (inputData.price_variants as Array<{ price: string; label: string }>) ?? [];
      return pvs.map(pv => `${offer}\n\nPreis: ${pv.price}${pv.label ? ` (${pv.label})` : ""}`);
    }
    case "ad": {
      const advs = (inputData.ad_variants as Array<{ text: string; headline: string; cta: string }>) ?? [];
      return advs.map(av => [av.headline, av.text, av.cta ? `CTA: ${av.cta}` : ""].filter(Boolean).join("\n"));
    }
    case "landing": {
      const urls = (inputData.urls as string[]) ?? [];
      const goal = inputData.landing_goal as string ?? "";
      return urls.map(url => `Landing Page: ${url}\nZiel: ${goal}`);
    }
    case "campaign": return [inputData.campaign_brief as string ?? ""];
    case "crisis": {
      const msg = inputData.crisis_message as string ?? "";
      const counter = inputData.counter_message as string;
      if (counter) return [msg, `Nachricht: ${msg}\n\nReaktion: ${counter}`];
      return [msg];
    }
    default: return [];
  }
}

// --- Preset Descriptions ---

const PRESET_DESCRIPTIONS: Record<string, string> = {
  dach_allgemein: "Breiter Querschnitt der deutschsprachigen Bevölkerung, 25-55 Jahre, verschiedene Berufe und Lebenssituationen.",
  solo_unternehmer: "Selbstständige im Bereich Coaching, Beratung und Training. Online aktiv, bauen Personal Brand auf.",
  ecom_kaeufer: "Menschen die regelmäßig online einkaufen. Vergleichen Preise, lesen Bewertungen, reagieren auf Social Proof.",
  b2b_entscheider: "Geschäftsführer und Teamleads in KMUs. ROI-orientiert, wenig Zeit, treffen Kaufentscheidungen.",
  gen_z: "18-27 Jahre, digital native, werteorientiert, skeptisch gegenüber klassischer Werbung.",
};

// ============================================
// EDGE FUNCTION HANDLER
// ============================================

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { simulationId } = await req.json();
    if (!simulationId) throw new Error("simulationId fehlt");

    // 1. Simulation laden
    const { data: sim, error: simErr } = await supabase
      .from("simulations")
      .select("*")
      .eq("id", simulationId)
      .single();

    if (simErr || !sim) throw new Error("Simulation nicht gefunden");
    if (sim.status !== "queued") throw new Error(`Status ist '${sim.status}', erwartet 'queued'`);

    // Status auf running setzen
    await supabase.from("simulations").update({ status: "running", started_at: new Date().toISOString() }).eq("id", simulationId);

    // 2. Personas laden/generieren
    let personas: Persona[] = [];

    if (sim.persona_id) {
      const { data: profile } = await supabase
        .from("persona_profiles")
        .select("personas, description")
        .eq("id", sim.persona_id)
        .single();

      if (profile?.personas?.length) {
        personas = profile.personas;
      } else if (profile?.description) {
        personas = await generatePersonas(profile.description, sim.agent_count);
        await supabase.from("persona_profiles").update({ personas, agent_count_default: sim.agent_count }).eq("id", sim.persona_id);
      }
    } else if (sim.persona_preset) {
      const desc = PRESET_DESCRIPTIONS[sim.persona_preset] ?? PRESET_DESCRIPTIONS.dach_allgemein;
      personas = await generatePersonas(desc, sim.agent_count);
    }

    if (personas.length === 0) throw new Error("Keine Personas verfügbar");
    if (personas.length > sim.agent_count) personas = personas.slice(0, sim.agent_count);

    // 3. Varianten extrahieren
    const variants = extractVariants(sim.sim_type, sim.input_data);
    if (variants.length === 0) throw new Error("Keine Varianten");

    const stimulusType = mapSimType(sim.sim_type);
    const contextLayer = sim.input_data?.context as string | undefined;

    // 4. Simulation ausführen
    const result = await runSimulation(personas, variants, stimulusType, contextLayer);

    // 5. Report generieren
    const report = await generateReport(variants, result);

    // 6. Ergebnis speichern
    await supabase.from("simulations").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      result_data: {
        reactions: result.reactions,
        variantStats: result.variantStats,
        report: {
          winnerIndex: report.winnerIndex,
          summary: report.summary,
          segmentBreakdown: report.segmentBreakdown,
          improvementSuggestions: report.improvementSuggestions,
        },
      },
    }).eq("id", simulationId);

    return new Response(JSON.stringify({ success: true, simulationId }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("Edge Function error:", message);

    // Versuche Simulation als failed zu markieren
    try {
      const { simulationId } = await req.clone().json();
      if (simulationId) {
        await supabase.from("simulations").update({ status: "failed" }).eq("id", simulationId);
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

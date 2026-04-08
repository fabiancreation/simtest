import { getAnthropic } from "@/lib/anthropic/client";
import type { Persona, StimulusType } from "@/types/simulation";

export interface AgentReaction {
  persona: Persona;
  variantIndex: number;
  reaction: string;
  sentiment: "positiv" | "neutral" | "negativ";
  wouldEngage: boolean;
}

function buildAgentPrompt(
  persona: Persona,
  stimulus: string,
  stimulusType: StimulusType,
  contextLayer?: string
): string {
  const typeLabel =
    stimulusType === "copy"
      ? "einen Werbetext"
      : stimulusType === "product"
      ? "ein Produktangebot"
      : "eine Geschäftsstrategie";

  return `Du bist ${persona.name}, ${persona.age} Jahre alt, ${persona.occupation} aus ${persona.location}.
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
}

async function getReaction(
  persona: Persona,
  stimulus: string,
  stimulusType: StimulusType,
  variantIndex: number,
  contextLayer?: string
): Promise<AgentReaction> {
  const anthropic = getAnthropic();
  const prompt = buildAgentPrompt(persona, stimulus, stimulusType, contextLayer);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      persona,
      variantIndex,
      reaction: text.slice(0, 300),
      sentiment: "neutral",
      wouldEngage: false,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    persona,
    variantIndex,
    reaction: parsed.reaction ?? text.slice(0, 300),
    sentiment: parsed.sentiment ?? "neutral",
    wouldEngage: parsed.wouldEngage ?? false,
  };
}

export interface SimulationResult {
  reactions: AgentReaction[];
  variantStats: VariantStats[];
}

export interface VariantStats {
  variantIndex: number;
  totalAgents: number;
  positiv: number;
  neutral: number;
  negativ: number;
  engagementRate: number;
}

export async function runSimulation(
  personas: Persona[],
  variants: string[],
  stimulusType: StimulusType,
  contextLayer?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<SimulationResult> {
  const total = personas.length * variants.length;
  let completed = 0;
  const reactions: AgentReaction[] = [];

  // Batched: max 5 parallele Anfragen (Haiku Rate Limits)
  const BATCH_SIZE = 5;
  const tasks: Array<() => Promise<AgentReaction>> = [];

  for (let vi = 0; vi < variants.length; vi++) {
    for (const persona of personas) {
      tasks.push(() =>
        getReaction(persona, variants[vi], stimulusType, vi, contextLayer)
      );
    }
  }

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((fn) => fn()));

    for (const result of results) {
      completed++;
      if (result.status === "fulfilled") {
        reactions.push(result.value);
      }
      onProgress?.(completed, total);
    }
  }

  const variantStats: VariantStats[] = variants.map((_, vi) => {
    const variantReactions = reactions.filter((r) => r.variantIndex === vi);
    const totalAgents = variantReactions.length;
    const positiv = variantReactions.filter((r) => r.sentiment === "positiv").length;
    const neutral = variantReactions.filter((r) => r.sentiment === "neutral").length;
    const negativ = variantReactions.filter((r) => r.sentiment === "negativ").length;
    const engaged = variantReactions.filter((r) => r.wouldEngage).length;

    return {
      variantIndex: vi,
      totalAgents,
      positiv,
      neutral,
      negativ,
      engagementRate: totalAgents > 0 ? engaged / totalAgents : 0,
    };
  });

  return { reactions, variantStats };
}

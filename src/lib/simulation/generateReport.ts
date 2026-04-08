import { getAnthropic } from "@/lib/anthropic/client";
import type { SimulationResult, AgentReaction, VariantStats } from "./runSimulation";

export interface SimulationReport {
  winnerIndex: number;
  summary: string;
  segmentBreakdown: SegmentBreakdown;
  improvementSuggestions: string[];
}

export interface SegmentBreakdown {
  byVariant: VariantStats[];
  topObjections: string[];
  topPraises: string[];
  engagementByAge: AgeSegment[];
}

interface AgeSegment {
  ageRange: string;
  engagementRate: number;
  dominantSentiment: string;
}

function buildReportPrompt(
  variants: string[],
  result: SimulationResult
): string {
  const variantSummaries = result.variantStats.map((vs, i) => {
    const reactions = result.reactions
      .filter((r) => r.variantIndex === i)
      .map((r) => `- ${r.persona.name} (${r.sentiment}): "${r.reaction}"`)
      .join("\n");

    return `VARIANTE ${i + 1}:
"""
${variants[i]}
"""
Positiv: ${vs.positiv} | Neutral: ${vs.neutral} | Negativ: ${vs.negativ} | Engagement: ${(vs.engagementRate * 100).toFixed(0)}%

Reaktionen:
${reactions}`;
  });

  return `Analysiere die folgenden Simulations-Ergebnisse und erstelle einen Report.

${variantSummaries.join("\n\n---\n\n")}

Erstelle einen Report als JSON mit exakt diesen Feldern:
{
  "winnerIndex": 0-basierter Index der besten Variante,
  "summary": "3-5 Sätze Zusammenfassung mit klarer Empfehlung",
  "topObjections": ["Die 3 häufigsten Einwände"],
  "topPraises": ["Die 3 häufigsten positiven Punkte"],
  "improvementSuggestions": ["3-5 konkrete Verbesserungsvorschläge für die Gewinner-Variante"]
}

Nur JSON, keine Erklärungen.`;
}

function calculateAgeSegments(reactions: AgentReaction[]): AgeSegment[] {
  const ranges = [
    { label: "18-29", min: 18, max: 29 },
    { label: "30-44", min: 30, max: 44 },
    { label: "45-59", min: 45, max: 59 },
    { label: "60+", min: 60, max: 120 },
  ];

  return ranges
    .map((range) => {
      const inRange = reactions.filter(
        (r) => r.persona.age >= range.min && r.persona.age <= range.max
      );
      if (inRange.length === 0) return null;

      const engaged = inRange.filter((r) => r.wouldEngage).length;
      const sentiments = { positiv: 0, neutral: 0, negativ: 0 };
      inRange.forEach((r) => sentiments[r.sentiment]++);

      const dominant = Object.entries(sentiments).sort(
        ([, a], [, b]) => b - a
      )[0][0];

      return {
        ageRange: range.label,
        engagementRate: engaged / inRange.length,
        dominantSentiment: dominant,
      };
    })
    .filter((s): s is AgeSegment => s !== null);
}

export async function generateReport(
  variants: string[],
  result: SimulationResult
): Promise<SimulationReport> {
  const anthropic = getAnthropic();
  const prompt = buildReportPrompt(variants, result);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system:
      "Du bist ein Marktforschungs-Analyst. Erstelle präzise, actionable Reports auf Deutsch. Antworte nur als JSON.",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Keine Report-Antwort erhalten");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Kein JSON in Report-Antwort");

  const parsed = JSON.parse(jsonMatch[0]);
  const ageSegments = calculateAgeSegments(result.reactions);

  return {
    winnerIndex: parsed.winnerIndex ?? 0,
    summary: parsed.summary ?? "Kein Summary verfügbar.",
    segmentBreakdown: {
      byVariant: result.variantStats,
      topObjections: parsed.topObjections ?? [],
      topPraises: parsed.topPraises ?? [],
      engagementByAge: ageSegments,
    },
    improvementSuggestions: parsed.improvementSuggestions ?? [],
  };
}

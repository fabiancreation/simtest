import type { Agent, Reaction, Variant, SimulationReport, VariantReport, PersonaInsight, RoundSummary } from "./types.ts";

/**
 * Aggregiert Reaktionen zu einem strukturierten Report.
 * Berechnet Engagement, Sentiment, Persona-Insights, Runden-Progression.
 */

export function generateReport(
  agents: Agent[],
  reactions: Reaction[],
  variants: Variant[],
): SimulationReport {
  // 1. Varianten-Reports
  const variantReports = variants.map(v => buildVariantReport(v, agents, reactions));

  // 2. Gewinner
  const sorted = [...variantReports].sort((a, b) => b.engagement_rate - a.engagement_rate);
  const winner = sorted[0].variant_id;

  // 3. Confidence
  const gap = sorted.length >= 2 ? sorted[0].engagement_rate - sorted[1].engagement_rate : 0;
  const confidence = gap > 0.2 ? "high" as const : gap > 0.1 ? "medium" as const : "low" as const;

  // 4. Persona-Insights
  const personaInsights = extractPersonaInsights(agents, reactions, variants);

  // 5. Runden-Progression
  const roundProgression = buildRoundProgression(agents, reactions, variants);

  // 6. Key Insights
  const keyInsights = deriveKeyInsights(variantReports, personaInsights, confidence);

  return {
    variants: variantReports,
    winner,
    confidence,
    key_insights: keyInsights,
    persona_breakdown: personaInsights,
    round_progression: roundProgression,
  };
}

function buildVariantReport(
  variant: Variant,
  agents: Agent[],
  reactions: Reaction[],
): VariantReport {
  const variantAgents = agents.filter(a => a.assignedVariant === variant.id);
  const variantReactions = reactions.filter(r => r.variantId === variant.id);

  // Letzte Runde für finale Engagement-Berechnung
  const lastRound = Math.max(1, ...variantReactions.map(r => r.round));
  const finalReactions = variantReactions.filter(r => r.round === lastRound);

  const total = variantAgents.length || 1;
  const likes = finalReactions.filter(r => r.action === "like").length;
  const comments = finalReactions.filter(r => r.action === "comment").length;
  const shares = finalReactions.filter(r => r.action === "share").length;
  const ignores = finalReactions.filter(r => r.action === "ignore").length;

  // Top-Kommentare
  const commentReactions = variantReactions.filter(r => r.action === "comment" && r.commentText);
  const topComments = commentReactions.slice(0, 5).map(r => {
    const agent = agents.find(a => a.index === r.agentIndex);
    return {
      agent_name: agent?.persona.name ?? "Unbekannt",
      text: r.commentText!,
      sentiment: classifySentiment(r),
    };
  });

  // Sentiment-Verteilung (alle Runden, alle Reaktionen mit Kommentaren)
  const sentiments = commentReactions.map(r => classifySentiment(r));

  return {
    variant_id: variant.id,
    label: variant.label,
    total_agents: variantAgents.length,
    engagement_rate: (likes + comments + shares) / total,
    like_count: likes,
    comment_count: comments,
    share_count: shares,
    ignore_count: ignores,
    avg_interest: avg(finalReactions.map(r => r.interestLevel)),
    avg_credibility: avg(finalReactions.map(r => r.credibilityRating)),
    top_comments: topComments,
    sentiment_distribution: {
      positive: sentiments.filter(s => s === "positive").length,
      neutral: sentiments.filter(s => s === "neutral").length,
      negative: sentiments.filter(s => s === "negative").length,
    },
  };
}

function extractPersonaInsights(
  agents: Agent[],
  reactions: Reaction[],
  variants: Variant[],
): PersonaInsight[] {
  const insights: PersonaInsight[] = [];

  // Segmente definieren
  const segments: Array<{ label: string; filter: (a: Agent) => boolean }> = [
    { label: "Hohe Gewissenhaftigkeit (7+)", filter: a => (a.persona.big_five?.conscientiousness ?? 5) >= 7 },
    { label: "Niedrige Gewissenhaftigkeit (1-4)", filter: a => (a.persona.big_five?.conscientiousness ?? 5) <= 4 },
    { label: "Hohe Offenheit (7+)", filter: a => (a.persona.big_five?.openness ?? 5) >= 7 },
    { label: "Niedrige Offenheit (1-4)", filter: a => (a.persona.big_five?.openness ?? 5) <= 4 },
    { label: "Hohe Extraversion (7+)", filter: a => (a.persona.big_five?.extraversion ?? 5) >= 7 },
    { label: "Unter 30", filter: a => a.persona.age < 30 },
    { label: "30-45", filter: a => a.persona.age >= 30 && a.persona.age <= 45 },
    { label: "Über 45", filter: a => a.persona.age > 45 },
  ];

  const lastRound = Math.max(1, ...reactions.map(r => r.round));

  for (const seg of segments) {
    const segAgents = agents.filter(seg.filter);
    if (segAgents.length < 3) continue;

    const engagementPerVariant: Record<string, number> = {};
    for (const v of variants) {
      const vAgents = segAgents.filter(a => a.assignedVariant === v.id);
      if (vAgents.length === 0) { engagementPerVariant[v.id] = 0; continue; }
      const vReactions = reactions.filter(
        r => r.round === lastRound && r.variantId === v.id && vAgents.some(a => a.index === r.agentIndex)
      );
      const engaged = vReactions.filter(r => r.action !== "ignore").length;
      engagementPerVariant[v.id] = engaged / vAgents.length;
    }

    const sorted = Object.entries(engagementPerVariant).sort(([, a], [, b]) => b - a);
    if (sorted.length < 2) continue;

    const [bestId, bestRate] = sorted[0];
    const [, secondRate] = sorted[1];
    if (bestRate - secondRate < 0.05) continue;

    const bestVariant = variants.find(v => v.id === bestId);
    insights.push({
      segment: seg.label,
      preferred_variant: bestId,
      reason: `${Math.round(bestRate * 100)}% Engagement für "${bestVariant?.label ?? bestId}" - ${Math.round((bestRate - secondRate) * 100)} Prozentpunkte Vorsprung.`,
    });
  }

  return insights;
}

function buildRoundProgression(
  agents: Agent[],
  reactions: Reaction[],
  variants: Variant[],
): RoundSummary[] {
  const rounds = [...new Set(reactions.map(r => r.round))].sort((a, b) => a - b);

  return rounds.map(round => {
    const roundReactions = reactions.filter(r => r.round === round);
    const actionsPerVariant: Record<string, { likes: number; comments: number; shares: number; ignores: number }> = {};

    for (const v of variants) {
      const vReactions = roundReactions.filter(r => r.variantId === v.id);
      actionsPerVariant[v.id] = {
        likes: vReactions.filter(r => r.action === "like").length,
        comments: vReactions.filter(r => r.action === "comment").length,
        shares: vReactions.filter(r => r.action === "share").length,
        ignores: vReactions.filter(r => r.action === "ignore").length,
      };
    }

    return { round, actions_per_variant: actionsPerVariant };
  });
}

function deriveKeyInsights(
  variantReports: VariantReport[],
  personaInsights: PersonaInsight[],
  confidence: string,
): string[] {
  const insights: string[] = [];

  const sorted = [...variantReports].sort((a, b) => b.engagement_rate - a.engagement_rate);
  const best = sorted[0];

  insights.push(
    `"${best.label}" erreicht ${Math.round(best.engagement_rate * 100)}% Engagement - stärkste Variante.`
  );

  // Credibility-Abweichung
  const highestCred = [...variantReports].sort((a, b) => b.avg_credibility - a.avg_credibility)[0];
  if (highestCred.variant_id !== best.variant_id) {
    insights.push(
      `"${highestCred.label}" wird als glaubwürdiger eingestuft (${highestCred.avg_credibility.toFixed(1)}/10), obwohl "${best.label}" mehr Engagement generiert.`
    );
  }

  // Shares als Viralitäts-Indikator
  const mostShared = [...variantReports].sort((a, b) => b.share_count - a.share_count)[0];
  if (mostShared.share_count > 0) {
    insights.push(
      `"${mostShared.label}" wurde ${mostShared.share_count}x geteilt - höchstes virales Potenzial.`
    );
  }

  // Top Persona-Insights
  for (const pi of personaInsights.slice(0, 3)) {
    insights.push(`Segment "${pi.segment}" bevorzugt "${pi.preferred_variant}": ${pi.reason}`);
  }

  if (confidence === "low") {
    insights.push(
      "Geringe Konfidenz: Die Unterschiede zwischen den Varianten sind klein. Für belastbarere Ergebnisse die Simulation mit mehr Agenten wiederholen."
    );
  }

  return insights;
}

// --- Helpers ---

function classifySentiment(r: Reaction): "positive" | "neutral" | "negative" {
  if (r.interestLevel >= 7) return "positive";
  if (r.interestLevel <= 3) return "negative";
  return "neutral";
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

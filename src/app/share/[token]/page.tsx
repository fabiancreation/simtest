"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// --- Types ---

interface VariantReportData {
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
  top_comments: Array<{ agent_name: string; text: string; sentiment: string }>;
  agent_feedback: Array<{ agent_name: string; reasoning: string; action: string; interest_level: number }>;
  sentiment_distribution: { positive: number; neutral: number; negative: number };
}

interface PersonaInsight {
  segment: string;
  preferred_variant: string;
  reason: string;
}

interface NewReport {
  variants: VariantReportData[];
  winner: string;
  confidence: "low" | "medium" | "high";
  key_insights: string[];
  persona_breakdown: PersonaInsight[];
  round_progression: Array<{
    round: number;
    actions_per_variant: Record<string, { likes: number; comments: number; shares: number; ignores: number }>;
  }>;
}

interface SimData {
  id: string;
  sim_type: string;
  status: string;
  agent_count: number;
  sim_depth: string;
  created_at: string;
  completed_at: string | null;
  total_rounds: number | null;
  input_data: Record<string, unknown>;
  result_data: {
    report: NewReport;
    synthesis?: {
      summary: string;
      recommendations: string[];
      objection_clusters: string[];
      buy_rate: number;
    };
  } | null;
  name: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  copy: "Copy Test", product: "Produkt-Check", pricing: "Pricing Test",
  ad: "Ad Creative", landing: "Landing Page", campaign: "Kampagnen-Check", crisis: "Krisentest", strategy: "Business-Strategie",
};

const CONTENT_LABELS: Record<string, string> = {
  copy: "Getesteter Content", product: "Getestetes Angebot", pricing: "Getestete Preise",
  ad: "Getestete Anzeige", landing: "Getestete Landing Page", campaign: "Getestete Kampagne",
  crisis: "Getestete Nachricht", strategy: "Getestete Strategie",
};

const CONFIDENCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "Hohe Konfidenz", color: "var(--color-accent)", bg: "var(--color-accent-glow)" },
  medium: { label: "Mittlere Konfidenz", color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
  low: { label: "Geringe Konfidenz", color: "var(--color-red)", bg: "rgba(248,113,113,0.1)" },
};

function fmt(n: number): string { return Number.isFinite(n) ? n.toFixed(1) : "0.0"; }

function extractVariantTexts(simType: string, inputData: Record<string, unknown>): string[] {
  switch (simType) {
    case "copy": return (inputData.variants as string[]) ?? [];
    case "product": return [inputData.offer as string ?? ""];
    case "pricing": {
      const pvs = (inputData.price_variants as Array<{ price: string; label: string }>) ?? [];
      return pvs.map(pv => `${pv.price}${pv.label ? ` (${pv.label})` : ""}`);
    }
    case "ad": {
      const advs = (inputData.ad_variants as Array<{ text: string }>) ?? [];
      return advs.map(av => av.text);
    }
    case "landing": return (inputData.urls as string[]) ?? [];
    case "campaign": return [inputData.campaign_brief as string ?? ""];
    case "crisis": return [inputData.crisis_message as string ?? ""];
    case "strategy": {
      const parts = [inputData.strategy_idea as string ?? ""];
      if (inputData.strategy_market) parts.push(`Zielmarkt: ${inputData.strategy_market}`);
      if (inputData.strategy_competitors) parts.push(`Wettbewerber: ${inputData.strategy_competitors}`);
      if (inputData.strategy_pricing) parts.push(`Preisgestaltung: ${inputData.strategy_pricing}`);
      return [parts.join("\n\n")];
    }
    default: return [];
  }
}

export default function SharedReportPage() {
  const params = useParams();
  const [sim, setSim] = useState<SimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/share/${params.token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Report nicht gefunden");
          setLoading(false);
          return;
        }
        const data: SimData = await res.json();
        setSim(data);
      } catch {
        setError("Fehler beim Laden des Reports");
      }
      setLoading(false);
    }
    fetchReport();
  }, [params.token]);

  if (loading) {
    return (
      <div className="text-center mt-20 animate-slide-up">
        <div className="w-12 h-12 mx-auto rounded-full animate-pulse" style={{ background: "var(--color-border)" }} />
        <p className="text-text-muted text-sm mt-4">Report wird geladen...</p>
      </div>
    );
  }

  if (error || !sim) {
    return (
      <div className="text-center mt-20 space-y-4 animate-slide-up">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "rgba(248,113,113,0.1)" }}>
          <svg className="w-8 h-8 text-red" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>
          {error ?? "Report nicht gefunden"}
        </h1>
        <p className="text-text-muted text-sm">
          Dieser Link ist ungültig oder der Report wurde deaktiviert.
        </p>
      </div>
    );
  }

  const report = sim.result_data?.report;
  const synthesis = sim.result_data?.synthesis;
  const variantTexts = extractVariantTexts(sim.sim_type, sim.input_data);

  if (!report) {
    return (
      <div className="text-center mt-20 animate-slide-up">
        <p className="text-text-muted">Keine Ergebnisdaten vorhanden.</p>
      </div>
    );
  }

  const winnerVariant = report.variants?.find(v => v.variant_id === report.winner);
  const loserVariant = report.variants?.find(v => v.variant_id !== report.winner);
  const conf = CONFIDENCE_LABELS[report.confidence] ?? CONFIDENCE_LABELS.medium;
  const hasMultipleVariants = (report.variants?.length ?? 0) > 1;
  const buyRate = synthesis?.buy_rate ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          SimTest Report
        </h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="badge" style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}>
            {TYPE_LABELS[sim.sim_type] ?? sim.sim_type}
          </span>
          <span className="badge" style={{ background: conf.bg, color: conf.color }}>{conf.label}</span>
          <span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
            {new Date(sim.created_at).toLocaleDateString("de-DE")} / {sim.agent_count} Agenten
            {sim.total_rounds && sim.total_rounds > 1 ? ` / ${sim.total_rounds} Runden` : ""}
          </span>
        </div>
      </div>

      {/* Getesteter Content */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: "60ms" }}>
        <h3 className="mb-4" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>{CONTENT_LABELS[sim.sim_type] ?? "Getesteter Content"}</h3>
        <div className="space-y-3">
          {variantTexts.map((text, i) => {
            const varId = String.fromCharCode(65 + i);
            const isWinner = hasMultipleVariants && varId === report.winner;
            return (
              <div key={i} className="rounded-xl p-4" style={{
                border: `1.5px solid ${isWinner ? "var(--color-accent)" : "var(--color-border)"}`,
                background: isWinner ? "var(--color-accent-glow)" : "transparent",
              }}>
                {hasMultipleVariants && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                      fontFamily: "var(--font-mono)",
                      background: isWinner ? "var(--color-accent)" : "var(--color-border)",
                      color: isWinner ? "white" : "var(--color-text-dim)",
                    }}>
                      {varId}
                    </span>
                    {isWinner && <span className="text-xs text-accent font-semibold">Gewinner</span>}
                  </div>
                )}
                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ergebnis-Zusammenfassung */}
      <div className="animate-slide-up rounded-2xl p-6 relative overflow-hidden" style={{
        animationDelay: "120ms",
        background: "linear-gradient(135deg, var(--color-accent-glow), transparent)",
        border: "1px solid var(--color-accent)",
      }}>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {hasMultipleVariants
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            }
          </svg>
          <span className="text-xs uppercase tracking-wider text-accent" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {hasMultipleVariants ? "GEWINNER" : "ANALYSE"}
          </span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>
          {hasMultipleVariants
            ? `${winnerVariant?.label ?? "Variante A"} gewinnt`
            : "Zielgruppen-Reaktion"
          }
        </h2>
        {winnerVariant && (
          <div className="flex items-center gap-6 mt-3 flex-wrap">
            <div>
              <span className="text-3xl font-bold text-accent" style={{ fontFamily: "var(--font-mono)" }}>
                {Math.round(winnerVariant.engagement_rate * 100)}%
              </span>
              <span className="text-xs text-text-dim block" style={{ fontFamily: "var(--font-mono)" }}>Engagement</span>
            </div>
            {loserVariant && (
              <>
                <span className="text-text-dim text-lg">vs.</span>
                <div>
                  <span className="text-3xl font-bold text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                    {Math.round(loserVariant.engagement_rate * 100)}%
                  </span>
                  <span className="text-xs text-text-dim block" style={{ fontFamily: "var(--font-mono)" }}>Engagement</span>
                </div>
              </>
            )}
            <div className="ml-auto text-right">
              <span className="text-sm text-text-muted">{fmt(winnerVariant.avg_interest)}/10 Interesse</span>
              <span className="text-xs text-text-dim block">{fmt(winnerVariant.avg_credibility)}/10 Glaubwürdigkeit</span>
            </div>
          </div>
        )}
        {winnerVariant && (
          <div className="flex gap-6 mt-4 flex-wrap">
            {buyRate > 0 && (
              <div>
                <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)", color: buyRate > 0.5 ? "var(--color-accent)" : buyRate > 0.2 ? "var(--color-warning)" : "var(--color-red)" }}>
                  {Math.round(buyRate * 100)}%
                </span>
                <span className="text-xs text-text-dim block" style={{ fontFamily: "var(--font-mono)" }}>würden kaufen</span>
              </div>
            )}
            <div className="flex gap-3 items-end text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
              {winnerVariant.like_count > 0 && <span>{winnerVariant.like_count} Like{winnerVariant.like_count !== 1 ? "s" : ""}</span>}
              {winnerVariant.comment_count > 0 && <span>{winnerVariant.comment_count} Kommentar{winnerVariant.comment_count !== 1 ? "e" : ""}</span>}
              {winnerVariant.share_count > 0 && <span>{winnerVariant.share_count} Share{winnerVariant.share_count !== 1 ? "s" : ""}</span>}
              {winnerVariant.ignore_count > 0 && <span>{winnerVariant.ignore_count} ignoriert</span>}
            </div>
          </div>
        )}
      </div>

      {/* AI-Synthese */}
      {synthesis?.summary && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: "140ms" }}>
          <h3 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Zusammenfassung</h3>
          <p className="text-sm text-text-muted leading-relaxed">{synthesis.summary}</p>

          {synthesis.objection_clusters?.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-2.5" style={{ fontFamily: "var(--font-mono)" }}>Häufigste Einwände</h4>
              <div className="space-y-2">
                {synthesis.objection_clusters.map((obj, i) => (
                  <div key={i} className="flex gap-2.5 items-start text-sm">
                    <span className="text-red mt-0.5 shrink-0">!</span>
                    <span className="text-text-muted">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {synthesis.recommendations?.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-2.5" style={{ fontFamily: "var(--font-mono)" }}>Empfehlungen</h4>
              <div className="space-y-2">
                {synthesis.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2.5 items-start text-sm">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{
                      background: "var(--color-accent-glow)", color: "var(--color-accent)", fontFamily: "var(--font-mono)",
                    }}>{i + 1}</span>
                    <span className="text-text-muted">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Insights */}
      {report.key_insights?.length > 0 && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <h3 className="mb-4" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Key Insights</h3>
          <ul className="space-y-3">
            {report.key_insights.map((insight, i) => (
              <li key={i} className="text-sm text-text-muted flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--color-accent-glow)" }}>
                  <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Agenten-Kommentare */}
      {report.variants?.some(v => v.top_comments?.length > 0) && (
        <div className="card p-6 animate-slide-up">
          <h3 className="mb-5" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Was die Agenten sagen</h3>
          <div className="space-y-6">
            {report.variants.map(v => (
              v.top_comments?.length > 0 && (
                <div key={v.variant_id}>
                  {hasMultipleVariants && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{
                        fontFamily: "var(--font-mono)",
                        background: v.variant_id === report.winner ? "var(--color-accent)" : "var(--color-border)",
                        color: v.variant_id === report.winner ? "white" : "var(--color-text-dim)",
                      }}>{v.variant_id}</span>
                      <span className="text-xs text-text-dim">{v.label}</span>
                    </div>
                  )}
                  <div className="space-y-3 ml-1">
                    {v.top_comments.map((c, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{
                          background: c.sentiment === "positive" ? "var(--color-accent-glow)" : c.sentiment === "negative" ? "rgba(248,113,113,0.1)" : "var(--color-border)",
                          color: c.sentiment === "positive" ? "var(--color-accent)" : c.sentiment === "negative" ? "var(--color-red)" : "var(--color-text-dim)",
                          fontFamily: "var(--font-mono)",
                        }}>
                          {c.agent_name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 rounded-xl p-3" style={{ background: "var(--color-border)", borderTopLeftRadius: 4 }}>
                          <span className="text-text-dim text-xs font-medium">{c.agent_name}</span>
                          <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Agent-Feedback */}
      {report.variants?.some(v => (v.agent_feedback?.length ?? 0) > 0) && (
        <div className="card p-6 animate-slide-up">
          <h3 className="mb-2" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>
            Was die Zielgruppe denkt
          </h3>
          <p className="text-xs text-text-dim mb-4">Interne Gedanken der Agenten - so würden sie nicht öffentlich kommentieren, aber so denken sie wirklich.</p>
          <div className="space-y-6">
            {report.variants.map(v => {
              const feedback = v.agent_feedback ?? [];
              if (feedback.length === 0) return null;
              return (
                <div key={v.variant_id}>
                  {hasMultipleVariants && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{
                        fontFamily: "var(--font-mono)",
                        background: v.variant_id === report.winner ? "var(--color-accent)" : "var(--color-border)",
                        color: v.variant_id === report.winner ? "white" : "var(--color-text-dim)",
                      }}>{v.variant_id}</span>
                      <span className="text-xs text-text-dim">{v.label}</span>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {feedback.map((fb, i) => {
                      const actionColors: Record<string, string> = {
                        like: "var(--color-accent)", comment: "#6366F1", share: "#8B5CF6", ignore: "var(--color-text-dim)",
                      };
                      const actionLabels: Record<string, string> = {
                        like: "liked", comment: "kommentiert", share: "geteilt", ignore: "ignoriert",
                      };
                      return (
                        <div key={i} className="rounded-lg p-3" style={{ background: "var(--color-border)" }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{fb.agent_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                                fontFamily: "var(--font-mono)",
                                color: actionColors[fb.action] ?? "var(--color-text-dim)",
                                background: fb.action === "ignore" ? "transparent" : `${actionColors[fb.action]}15`,
                              }}>
                                {actionLabels[fb.action] ?? fb.action}
                              </span>
                              <span className="text-[10px] text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                                {fb.interest_level}/10
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-text-muted leading-relaxed">{fb.reasoning}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

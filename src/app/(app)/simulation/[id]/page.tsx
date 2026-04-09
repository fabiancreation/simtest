"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

interface LegacyVariantStats {
  variantIndex: number;
  totalAgents: number;
  positiv: number;
  neutral: number;
  negativ: number;
  engagementRate: number;
}

interface SimData {
  id: string;
  sim_type: string;
  status: string;
  agent_count: number;
  sim_depth: string;
  created_at: string;
  completed_at: string | null;
  name: string | null;
  error_message: string | null;
  current_round: number | null;
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
    variantStats: LegacyVariantStats[];
  } | null;
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

export default function SimulationResultPage() {
  const params = useParams();
  const [sim, setSim] = useState<SimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dots, setDots] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [simName, setSimName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function fetchInitial() {
      const res = await fetch(`/api/simulations/${params.id}/status`);
      if (!res.ok) return;
      const data: SimData = await res.json();
      setSim(data);
      setLoading(false);
    }
    fetchInitial();
    const channel = supabase
      .channel(`simulation-${params.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "simulations",
        filter: `id=eq.${params.id}`,
      }, () => { fetchInitial(); })
      .subscribe();
    // Fallback-Polling alle 5s falls Realtime ausfällt
    const pollInterval = setInterval(() => { fetchInitial(); }, 5000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [params.id]);

  useEffect(() => {
    if (sim?.name) setSimName(sim.name);
  }, [sim?.name]);

  useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  function downloadPDF() {
    if (!sim) return;
    window.print();
  }

  async function handleShare() {
    if (!sim) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/simulations/${sim.id}/share`, { method: "POST" });
      if (!res.ok) { console.error("Share failed:", res.status); setShareLoading(false); return; }
      const data = await res.json();
      const url = `${window.location.origin}/share/${data.token}`;
      setShareUrl(url);
      // Clipboard mit Fallback
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Fallback: prompt zeigen
        window.prompt("Share-Link kopieren:", url);
      }
    } catch (e) { console.error("Share error:", e); }
    setShareLoading(false);
  }

  async function saveNewName() {
    if (!sim || !simName.trim()) return;
    await fetch(`/api/simulations/${sim.id}/rename`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: simName.trim() }),
    });
    setEditingName(false);
  }

  if (loading || !sim) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center animate-slide-up">
        <div className="w-12 h-12 mx-auto rounded-full animate-pulse" style={{ background: "var(--color-border)" }} />
        <p className="text-text-muted text-sm mt-4">Lade...</p>
      </div>
    );
  }

  // --- RUNNING / QUEUED ---
  if (sim.status === "running" || sim.status === "queued") {
    const roundInfo = sim.total_rounds && sim.total_rounds > 1 && sim.current_round
      ? ` (Runde ${sim.current_round}/${sim.total_rounds})` : "";
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-8 animate-slide-up">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-2xl animate-glow" style={{ background: "var(--color-accent-glow)", border: "1px solid var(--color-accent)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>
            Simulation läuft{roundInfo}{".".repeat(dots)}
          </h1>
          <p className="text-text-muted text-sm mt-2">{sim.agent_count} Agenten reagieren auf deine Varianten</p>
        </div>
        <div className="card p-5 text-left mx-auto max-w-xs space-y-3">
          <div className="flex justify-between"><span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>TYP</span><span className="text-sm text-text-muted">{TYPE_LABELS[sim.sim_type] ?? sim.sim_type}</span></div>
          <div className="h-px" style={{ background: "var(--color-border)" }} />
          <div className="flex justify-between"><span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>AGENTEN</span><span className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>{sim.agent_count}</span></div>
          {sim.total_rounds && sim.total_rounds > 1 && <>
            <div className="h-px" style={{ background: "var(--color-border)" }} />
            <div className="flex justify-between"><span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>RUNDEN</span><span className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>{sim.current_round ?? 0}/{sim.total_rounds}</span></div>
          </>}
        </div>
        <div className="max-w-xs mx-auto">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div className="h-full rounded-full transition-all" style={{
              width: sim.total_rounds && sim.current_round ? `${Math.max(10, (sim.current_round / sim.total_rounds) * 100)}%` : "65%",
              background: "linear-gradient(90deg, var(--color-accent-dim), var(--color-accent))", animation: "progressPulse 2s ease-in-out infinite",
            }} />
          </div>
          <p className="text-xs text-text-dim mt-3">Seite aktualisiert sich automatisch.</p>
        </div>
      </div>
    );
  }

  // --- FAILED ---
  if (sim.status === "failed") {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-6 animate-slide-up">
        <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "rgba(248,113,113,0.1)" }}>
          <svg className="w-10 h-10 text-red" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>Simulation fehlgeschlagen</h1>
        <p className="text-text-muted text-sm">
          {sim.error_message ? `Fehler: ${sim.error_message}` : "Beim Ausführen ist ein unbekannter Fehler aufgetreten."}
        </p>
        <p className="text-text-dim text-xs mt-1">Versuche es erneut oder reduziere die Agenten-Anzahl.</p>
        <Link href="/simulation/new" className="btn-primary text-sm inline-block">Neue Simulation</Link>
      </div>
    );
  }

  // --- COMPLETED: Show Report ---
  const report = sim.result_data?.report;
  const stats = sim.result_data?.variantStats ?? [];
  const variantTexts = extractVariantTexts(sim.sim_type, sim.input_data);

  if (!report) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center animate-slide-up">
        <p className="text-text-muted">Ergebnisse werden geladen...</p>
      </div>
    );
  }

  const synthesis = sim.result_data?.synthesis;
  const winnerVariant = report.variants?.find(v => v.variant_id === report.winner);
  const winnerIndex = winnerVariant ? report.variants.indexOf(winnerVariant) : 0;
  const loserVariant = report.variants?.find(v => v.variant_id !== report.winner);
  const conf = CONFIDENCE_LABELS[report.confidence] ?? CONFIDENCE_LABELS.medium;
  const hasMultipleVariants = (report.variants?.length ?? 0) > 1;
  const buyRate = synthesis?.buy_rate ?? 0;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <Link href="/dashboard" className="text-xs text-text-dim hover:text-text-muted transition-colors flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          DASHBOARD
        </Link>
        <h1 className="mt-3" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Simulations-Report
        </h1>
        {sim.name && (
          <div className="flex items-center gap-2 mt-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input value={simName} onChange={(e) => setSimName(e.target.value)}
                  className="text-sm px-2 py-1 rounded border bg-transparent"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}
                  autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveNewName(); if (e.key === "Escape") setEditingName(false); }} />
                <button onClick={saveNewName} className="text-xs text-accent cursor-pointer">Speichern</button>
                <button onClick={() => setEditingName(false)} className="text-xs text-text-dim cursor-pointer">Abbrechen</button>
              </div>
            ) : (
              <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text cursor-pointer transition-colors">
                {simName}
                <svg className="w-3 h-3 text-text-dim" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
            )}
          </div>
        )}
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
        <div className="flex gap-2 mt-3 print:hidden">
          <button onClick={downloadPDF} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
            style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-dim)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>
          <button onClick={handleShare} disabled={shareLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
            style={{ border: "1.5px solid var(--color-border)", color: shareUrl ? "var(--color-accent)" : "var(--color-text-dim)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {shareUrl ? "Link kopiert!" : shareLoading ? "..." : "Teilen"}
          </button>
        </div>
      </div>

      {/* === Getesteter Content === */}
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

      {/* === Ergebnis-Zusammenfassung === */}
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
        {/* Engagement + Metriken */}
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
        {/* Kaufbereitschaft + Actions */}
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

      {/* === AI-Synthese: Zusammenfassung + Empfehlungen === */}
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

      {/* === Key Insights === */}
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

      {/* === Varianten-Vergleich (neues Format) === */}
      {report.variants?.length > 1 && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: "280ms" }}>
          <h3 className="mb-5" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Varianten-Vergleich</h3>
          <div className="space-y-6">
            {report.variants.map((v) => {
              const total = v.total_agents || 1;
              const isWinner = v.variant_id === report.winner;
              const engaged = v.like_count + v.comment_count + v.share_count;
              return (
                <div key={v.variant_id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{
                        fontFamily: "var(--font-mono)",
                        background: isWinner ? "var(--color-accent)" : "var(--color-border)",
                        color: isWinner ? "white" : "var(--color-text-dim)",
                      }}>
                        {v.variant_id}
                      </span>
                      <span className="text-sm font-medium" style={{ fontFamily: "var(--font-display)" }}>{v.label}</span>
                    </div>
                    <span className="badge" style={{
                      background: v.engagement_rate > 0.6 ? "var(--color-accent-glow)" : v.engagement_rate > 0.3 ? "rgba(245,158,11,0.1)" : "rgba(248,113,113,0.1)",
                      color: v.engagement_rate > 0.6 ? "var(--color-accent)" : v.engagement_rate > 0.3 ? "var(--color-warning)" : "var(--color-red)",
                    }}>{Math.round(v.engagement_rate * 100)}% Engagement</span>
                  </div>
                  {/* Action-Bar: nur anzeigen wenn es Aktionen gibt */}
                  {engaged > 0 ? (
                    <div className="flex h-7 rounded-lg overflow-hidden" style={{ background: "var(--color-border)" }}>
                      {v.like_count > 0 && <div className="transition-all flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${(v.like_count / total) * 100}%`, minWidth: v.like_count > 0 ? 24 : 0, background: "var(--color-accent)" }}>{v.like_count}</div>}
                      {v.comment_count > 0 && <div className="transition-all flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${(v.comment_count / total) * 100}%`, minWidth: v.comment_count > 0 ? 24 : 0, background: "#6366F1" }}>{v.comment_count}</div>}
                      {v.share_count > 0 && <div className="transition-all flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${(v.share_count / total) * 100}%`, minWidth: v.share_count > 0 ? 24 : 0, background: "#8B5CF6" }}>{v.share_count}</div>}
                      {v.ignore_count > 0 && <div className="transition-all" style={{ width: `${(v.ignore_count / total) * 100}%` }} />}
                    </div>
                  ) : (
                    <div className="flex h-7 rounded-lg overflow-hidden items-center justify-center text-xs text-text-dim" style={{ background: "var(--color-border)" }}>
                      Alle Agenten haben ignoriert
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-text-dim flex-wrap">
                    {v.like_count > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-accent)" }} /> {v.like_count} Like{v.like_count !== 1 ? "s" : ""}</span>}
                    {v.comment_count > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#6366F1" }} /> {v.comment_count} Kommentar{v.comment_count !== 1 ? "e" : ""}</span>}
                    {v.share_count > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#8B5CF6" }} /> {v.share_count} Share{v.share_count !== 1 ? "s" : ""}</span>}
                    {v.ignore_count > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-border)" }} /> {v.ignore_count} ignoriert</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                    <span>Interesse: {fmt(v.avg_interest)}/10</span>
                    <span>Glaubwürdigkeit: {fmt(v.avg_credibility)}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === Legacy Variant Stats (alte Simulationen) === */}
      {!report.variants?.length && stats.length > 1 && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: "280ms" }}>
          <h3 className="mb-5" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Varianten-Vergleich</h3>
          <div className="space-y-5">
            {stats.map((v) => {
              const total = v.totalAgents || 1;
              return (
                <div key={v.variantIndex} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ fontFamily: "var(--font-display)" }}>Variante {v.variantIndex + 1}</span>
                    <span className="badge" style={{
                      background: v.engagementRate > 0.6 ? "var(--color-accent-glow)" : "rgba(245,158,11,0.1)",
                      color: v.engagementRate > 0.6 ? "var(--color-accent)" : "var(--color-warning)",
                    }}>{(v.engagementRate * 100).toFixed(0)}% Engagement</span>
                  </div>
                  <div className="flex h-7 rounded-lg overflow-hidden" style={{ background: "var(--color-border)" }}>
                    <div className="transition-all" style={{ width: `${(v.positiv / total) * 100}%`, background: "var(--color-accent)" }} />
                    <div className="transition-all" style={{ width: `${(v.neutral / total) * 100}%`, background: "var(--color-warning)" }} />
                    <div className="transition-all" style={{ width: `${(v.negativ / total) * 100}%`, background: "var(--color-red)" }} />
                  </div>
                  <div className="flex gap-5 text-xs text-text-dim">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-accent)" }} /> Positiv: {v.positiv}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-warning)" }} /> Neutral: {v.neutral}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-red)" }} /> Negativ: {v.negativ}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === Agenten-Kommentare (nach Variante getrennt) === */}
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

      {/* === Agent-Feedback (besonders wertvoll bei niedrigem Engagement) === */}
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

      {/* === Persona-Analyse === */}
      {report.persona_breakdown?.length > 0 && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
              <svg className="w-3.5 h-3.5 text-purple" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Persona-Analyse</h3>
          </div>
          <div className="space-y-4">
            {report.persona_breakdown.map((pi, i) => (
              <div key={i} className="rounded-xl p-3.5" style={{ background: "var(--color-border)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                    fontFamily: "var(--font-mono)",
                    background: "rgba(124,58,237,0.15)",
                    color: "var(--color-purple)",
                  }}>
                    {pi.preferred_variant}
                  </span>
                  <span className="text-sm font-medium" style={{ fontFamily: "var(--font-display)" }}>{pi.segment}</span>
                </div>
                <p className="text-sm text-text-muted ml-0.5">{pi.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 animate-slide-up pb-8">
        <Link href="/simulation/new" className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Neue Simulation
        </Link>
        <Link href="/dashboard" className="btn-secondary text-sm">Dashboard</Link>
      </div>
    </div>
  );
}

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

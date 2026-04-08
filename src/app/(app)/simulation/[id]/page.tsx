"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SimData {
  id: string;
  sim_type: string;
  status: string;
  agent_count: number;
  sim_depth: string;
  created_at: string;
  completed_at: string | null;
  input_data: Record<string, unknown>;
  result_data: {
    variantStats: Array<{
      variantIndex: number;
      totalAgents: number;
      positiv: number;
      neutral: number;
      negativ: number;
      engagementRate: number;
    }>;
    report: {
      winnerIndex: number;
      summary: string;
      segmentBreakdown: {
        byVariant: unknown[];
        topObjections: string[];
        topPraises: string[];
        engagementByAge: Array<{ ageRange: string; engagementRate: number; dominantSentiment: string }>;
      };
      improvementSuggestions: string[];
    };
  } | null;
}

const TYPE_LABELS: Record<string, string> = {
  copy: "Copy Test", product: "Produkt-Check", pricing: "Pricing Test",
  ad: "Ad Creative", landing: "Landing Page", campaign: "Kampagnen-Check", crisis: "Krisentest",
};

export default function SimulationResultPage() {
  const params = useParams();
  const [sim, setSim] = useState<SimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    async function poll() {
      const res = await fetch(`/api/simulations/${params.id}/status`);
      if (!res.ok) return;
      const data: SimData = await res.json();
      setSim(data);
      setLoading(false);

      if (data.status === "running" || data.status === "queued") {
        // Keep polling
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

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
            Simulation läuft{".".repeat(dots)}
          </h1>
          <p className="text-text-muted text-sm mt-2">{sim.agent_count} Agenten reagieren auf deine Varianten</p>
        </div>
        <div className="card p-5 text-left mx-auto max-w-xs space-y-3">
          <div className="flex justify-between"><span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>TYP</span><span className="text-sm text-text-muted">{TYPE_LABELS[sim.sim_type] ?? sim.sim_type}</span></div>
          <div className="h-px" style={{ background: "var(--color-border)" }} />
          <div className="flex justify-between"><span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>AGENTEN</span><span className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>{sim.agent_count}</span></div>
        </div>
        <div className="max-w-xs mx-auto">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div className="h-full rounded-full" style={{ width: "65%", background: "linear-gradient(90deg, var(--color-accent-dim), var(--color-accent))", animation: "progressPulse 2s ease-in-out infinite" }} />
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
        <p className="text-text-muted text-sm">Beim Ausführen ist ein Fehler aufgetreten. Versuche es mit weniger Agenten.</p>
        <Link href="/simulation/new" className="btn-primary text-sm inline-block">Neue Simulation</Link>
      </div>
    );
  }

  // --- COMPLETED: Show Report ---
  const report = sim.result_data?.report;
  const stats = sim.result_data?.variantStats ?? [];
  const variants = extractVariantTexts(sim.sim_type, sim.input_data);

  if (!report) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center animate-slide-up">
        <p className="text-text-muted">Ergebnisse werden geladen...</p>
      </div>
    );
  }

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
        <div className="flex items-center gap-3 mt-2">
          <span className="badge" style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}>
            {TYPE_LABELS[sim.sim_type] ?? sim.sim_type}
          </span>
          <span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
            {new Date(sim.created_at).toLocaleDateString("de-DE")} / {sim.agent_count} Agenten
          </span>
        </div>
      </div>

      {/* Winner */}
      <div className="animate-slide-up rounded-2xl p-6 relative overflow-hidden" style={{
        animationDelay: "80ms",
        background: "linear-gradient(135deg, var(--color-accent-glow), transparent)",
        border: "1px solid var(--color-accent)",
        borderColor: "rgba(var(--color-accent), 0.2)",
      }}>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172" />
          </svg>
          <span className="text-xs uppercase tracking-wider text-accent" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>GEWINNER</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>
          {variants.length > 1 ? `Variante ${report.winnerIndex + 1}` : "Ergebnis"}
        </h2>
        <p className="text-text-muted mt-3 text-sm leading-relaxed whitespace-pre-line">
          {variants[report.winnerIndex]?.slice(0, 300)}
          {(variants[report.winnerIndex]?.length ?? 0) > 300 && "..."}
        </p>
      </div>

      {/* Summary */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: "160ms" }}>
        <h3 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Zusammenfassung</h3>
        <p className="text-sm text-text-muted leading-relaxed">{report.summary}</p>
      </div>

      {/* Variant Stats */}
      {stats.length > 1 && (
        <div className="card p-6 animate-slide-up" style={{ animationDelay: "240ms" }}>
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

      {/* Top Positiv / Negativ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--color-accent-glow)" }}>
              <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--color-accent)" }}>Top positiv</h3>
          </div>
          <ul className="space-y-2.5">
            {report.segmentBreakdown.topPraises?.map((p, i) => (
              <li key={i} className="text-sm text-text-muted flex gap-2.5 items-start">
                <span className="text-accent mt-0.5 shrink-0">+</span><span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(248,113,113,0.15)" }}>
              <svg className="w-3.5 h-3.5 text-red" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--color-red)" }}>Top Einwände</h3>
          </div>
          <ul className="space-y-2.5">
            {report.segmentBreakdown.topObjections?.map((o, i) => (
              <li key={i} className="text-sm text-text-muted flex gap-2.5 items-start">
                <span className="text-red mt-0.5 shrink-0">-</span><span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggestions */}
      <div className="card p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
            <svg className="w-3.5 h-3.5 text-purple" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--color-purple)" }}>Verbesserungsvorschläge</h3>
        </div>
        <ol className="space-y-3">
          {report.improvementSuggestions?.map((s, i) => (
            <li key={i} className="text-sm text-text-muted flex gap-3 items-start">
              <span className="badge shrink-0" style={{ background: "rgba(124,58,237,0.1)", color: "var(--color-purple)", minWidth: 24, textAlign: "center" }}>{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

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

// Helper: Extract variant texts for display
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
    default: return [];
  }
}

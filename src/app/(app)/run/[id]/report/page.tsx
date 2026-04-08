import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReportCharts } from "@/components/simulation/ReportCharts";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: run } = await supabase
    .from("runs")
    .select("*, reports(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!run) redirect("/dashboard");

  const report = run.reports?.[0];
  if (!report) {
    return (
      <div className="max-w-2xl space-y-4 animate-slide-up">
        <div className="icon-glow mx-auto" style={{ "--glow-color": "rgba(96,165,250,0.1)" } as React.CSSProperties}>
          <svg className="w-6 h-6 text-blue animate-pulse" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>Report wird erstellt...</h1>
        <p className="text-text-muted text-sm">
          Die Simulation läuft noch. Der Report erscheint automatisch.
        </p>
        <Link href={`/run/${id}`} className="text-accent hover:underline text-sm">
          Zurück zur Live-Ansicht
        </Link>
      </div>
    );
  }

  const segmentBreakdown = report.segment_breakdown as {
    byVariant: Array<{
      variantIndex: number;
      totalAgents: number;
      positiv: number;
      neutral: number;
      negativ: number;
      engagementRate: number;
    }>;
    topObjections: string[];
    topPraises: string[];
    engagementByAge: Array<{
      ageRange: string;
      engagementRate: number;
      dominantSentiment: string;
    }>;
  };

  const suggestions = report.improvement_suggestions as string[];
  const variants = (run.stimulus_variants as string[]) ?? [];
  const typeLabels: Record<string, string> = { copy: "Copy Test", product: "Produkt-Check", strategy: "Strategie-Check" };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <Link href="/dashboard" className="text-xs text-text-dim hover:text-text-muted transition-colors flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          DASHBOARD
        </Link>
        <h1 className="mt-3" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Simulations-Report
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="badge" style={{ background: "rgba(110,231,183,0.1)", color: "var(--color-accent)" }}>
            {typeLabels[run.stimulus_type] ?? run.stimulus_type}
          </span>
          <span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
            {new Date(run.created_at).toLocaleDateString("de-DE")} / {run.agent_count} Agenten
          </span>
        </div>
      </div>

      {/* Winner */}
      <div className="animate-slide-up rounded-2xl p-6 relative overflow-hidden" style={{
        animationDelay: "80ms",
        background: "linear-gradient(135deg, rgba(110,231,183,0.06), rgba(52,211,153,0.02))",
        border: "1px solid rgba(110,231,183,0.2)",
        boxShadow: "0 0 40px rgba(110,231,183,0.06)",
      }}>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
          </svg>
          <span className="text-xs uppercase tracking-wider text-accent" style={{ fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.1em" }}>
            Gewinner
          </span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>
          Variante {(report.winner_index ?? 0) + 1}
        </h2>
        <p className="text-text-muted mt-3 text-sm leading-relaxed whitespace-pre-line">
          {variants[report.winner_index ?? 0]?.slice(0, 300)}
          {(variants[report.winner_index ?? 0]?.length ?? 0) > 300 && "..."}
        </p>
      </div>

      {/* Summary */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: "160ms" }}>
        <h3 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Zusammenfassung</h3>
        <p className="text-sm text-text-muted leading-relaxed">{report.summary}</p>
      </div>

      {/* Charts */}
      <div className="animate-slide-up" style={{ animationDelay: "240ms" }}>
        <ReportCharts
          byVariant={segmentBreakdown.byVariant}
          engagementByAge={segmentBreakdown.engagementByAge}
        />
      </div>

      {/* Top Positiv / Negativ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(110,231,183,0.15)" }}>
              <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--color-accent)" }}>Top positiv</h3>
          </div>
          <ul className="space-y-2.5">
            {segmentBreakdown.topPraises?.map((p, i) => (
              <li key={i} className="text-sm text-text-muted flex gap-2.5 items-start">
                <span className="text-accent mt-0.5 shrink-0">+</span>
                <span>{p}</span>
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
            {segmentBreakdown.topObjections?.map((o, i) => (
              <li key={i} className="text-sm text-text-muted flex gap-2.5 items-start">
                <span className="text-red mt-0.5 shrink-0">-</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggestions */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: "320ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(167,139,250,0.15)" }}>
            <svg className="w-3.5 h-3.5 text-purple" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--color-purple)" }}>Verbesserungsvorschläge</h3>
        </div>
        <ol className="space-y-3">
          {suggestions?.map((s, i) => (
            <li key={i} className="text-sm text-text-muted flex gap-3 items-start">
              <span className="badge shrink-0" style={{ background: "rgba(167,139,250,0.1)", color: "var(--color-purple)", minWidth: 24, textAlign: "center" }}>
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-3 animate-slide-up" style={{ animationDelay: "400ms" }}>
        <Link href="/run/new" className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Neue Simulation
        </Link>
        <Link href="/dashboard" className="btn-secondary text-sm">
          Dashboard
        </Link>
      </div>
    </div>
  );
}

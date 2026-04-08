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
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">Report wird erstellt...</h1>
        <p className="text-text-muted">
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

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="text-sm text-text-dim hover:text-text-muted transition-colors">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-2">Simulations-Report</h1>
        <p className="text-text-muted mt-1 capitalize">{run.stimulus_type} Test</p>
      </div>

      {/* Gewinner */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
        <p className="text-sm text-accent font-medium mb-1">Gewinner</p>
        <h2 className="text-xl font-bold">
          Variante {(report.winner_index ?? 0) + 1}
        </h2>
        <p className="text-text-muted mt-2 text-sm leading-relaxed whitespace-pre-line">
          {variants[report.winner_index ?? 0]?.slice(0, 300)}
          {(variants[report.winner_index ?? 0]?.length ?? 0) > 300 && "..."}
        </p>
      </div>

      {/* Zusammenfassung */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-semibold mb-3">Zusammenfassung</h3>
        <p className="text-sm text-text-muted leading-relaxed">{report.summary}</p>
      </div>

      {/* Varianten-Vergleich */}
      <ReportCharts
        byVariant={segmentBreakdown.byVariant}
        engagementByAge={segmentBreakdown.engagementByAge}
      />

      {/* Top Positiv / Negativ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h3 className="font-semibold text-accent mb-3">Top positiv</h3>
          <ul className="space-y-2">
            {segmentBreakdown.topPraises?.map((p, i) => (
              <li key={i} className="text-sm text-text-muted flex gap-2">
                <span className="text-accent">+</span> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h3 className="font-semibold text-red mb-3">Top Einwaende</h3>
          <ul className="space-y-2">
            {segmentBreakdown.topObjections?.map((o, i) => (
              <li key={i} className="text-sm text-text-muted flex gap-2">
                <span className="text-red">-</span> {o}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Verbesserungsvorschlaege */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-semibold mb-3">Verbesserungsvorschlaege</h3>
        <ol className="space-y-2 list-decimal list-inside">
          {suggestions?.map((s, i) => (
            <li key={i} className="text-sm text-text-muted">{s}</li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/run/new"
          className="rounded-lg bg-accent px-5 py-3 font-medium text-bg hover:bg-accent-dim transition-colors"
        >
          Neue Simulation
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-5 py-3 font-medium text-text-muted hover:bg-bg-card transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

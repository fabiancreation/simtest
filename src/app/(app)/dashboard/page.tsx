import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: recentRuns } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const runsUsed = profile?.runs_used ?? 0;
  const runsLimit = profile?.runs_limit ?? 3;
  const plan = profile?.simtest_plan ?? "free";
  const remaining = Math.max(0, runsLimit - runsUsed);
  const usagePercent = runsLimit > 0 ? (runsUsed / runsLimit) * 100 : 0;

  const stats = [
    {
      label: "Plan",
      value: plan,
      capitalize: true,
      color: "#a78bfa",
      icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
    },
    {
      label: "Runs diesen Monat",
      value: `${runsUsed} / ${runsLimit}`,
      color: "#60a5fa",
      icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    },
    {
      label: "Verbleibend",
      value: remaining.toString(),
      color: "#6ee7b7",
      icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Dashboard
        </h1>
        <p className="text-text-muted mt-1">Willkommen bei SimTest</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card p-5 animate-slide-up" style={{ "--accent-color": stat.color } as React.CSSProperties}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-dim uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                  {stat.label}
                </p>
                <p className={`mt-2 text-2xl font-bold ${stat.capitalize ? "capitalize" : ""}`} style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
                  {stat.value}
                </p>
              </div>
              <div className="icon-glow" style={{ "--glow-color": `${stat.color}15` } as React.CSSProperties}>
                <svg className="w-5 h-5" fill="none" stroke={stat.color} strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Bar */}
      <div className="card p-5 animate-slide-up" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-muted">Kontingent-Auslastung</span>
          <span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
            {usagePercent.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${usagePercent}%`,
              background: usagePercent > 80
                ? "linear-gradient(90deg, #f59e0b, #f87171)"
                : "linear-gradient(90deg, var(--color-accent-dim), var(--color-accent))",
              boxShadow: usagePercent > 0 ? "0 0 12px rgba(110,231,183,0.3)" : "none",
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="animate-slide-up" style={{ animationDelay: "320ms" }}>
        <Link href="/run/new" className="btn-primary inline-flex items-center gap-2.5 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Neue Simulation starten
        </Link>
      </div>

      {/* Recent Runs */}
      <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>
          Letzte Simulationen
        </h2>
        {!recentRuns?.length ? (
          <div className="card p-10 text-center">
            <div className="icon-glow mx-auto mb-4" style={{ "--glow-color": "rgba(110,231,183,0.1)" } as React.CSSProperties}>
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <p className="text-text-muted text-sm">Noch keine Simulationen.</p>
            <p className="text-text-dim text-xs mt-1">Starte deine erste Simulation und teste deine Ideen.</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {recentRuns.map((run) => {
              const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
                done: { color: "text-accent", bg: "rgba(110,231,183,0.1)", label: "Fertig" },
                running: { color: "text-blue", bg: "rgba(96,165,250,0.1)", label: "Läuft" },
                failed: { color: "text-red", bg: "rgba(248,113,113,0.1)", label: "Fehler" },
                queued: { color: "text-warning", bg: "rgba(245,158,11,0.1)", label: "Wartend" },
              };
              const status = statusConfig[run.status] ?? statusConfig.queued;
              const typeLabels: Record<string, string> = { copy: "Copy Test", product: "Produkt-Check", strategy: "Strategie-Check" };

              return (
                <Link
                  key={run.id}
                  href={run.status === "done" ? `/run/${run.id}/report` : `/run/${run.id}`}
                  className="card-interactive card flex items-center justify-between p-4 cursor-pointer animate-slide-up"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: status.bg }}>
                      <svg className={`w-4 h-4 ${status.color}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium">{typeLabels[run.stimulus_type] ?? run.stimulus_type}</span>
                      <span className="ml-3 text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                        {new Date(run.created_at).toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </div>
                  <span className="badge" style={{ color: `var(--color-${run.status === "done" ? "accent" : run.status === "running" ? "blue" : run.status === "failed" ? "red" : "warning"})`, background: status.bg }}>
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

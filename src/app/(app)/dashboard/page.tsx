import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  copy: "Copy Test", product: "Produkt-Check", pricing: "Pricing Test",
  ad: "Ad Creative", landing: "Landing Page", campaign: "Kampagnen-Check",
  crisis: "Krisentest", strategy: "Business-Strategie",
};

const TYPE_COLORS: Record<string, string> = {
  copy: "#10B981", product: "#6366F1", pricing: "#F59E0B",
  ad: "#EC4899", landing: "#0EA5E9", campaign: "#8B5CF6",
  crisis: "#EF4444", strategy: "#14B8A6",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: "Fertig", color: "var(--color-accent)", bg: "var(--color-accent-glow)" },
  done: { label: "Fertig", color: "var(--color-accent)", bg: "var(--color-accent-glow)" },
  running: { label: "Laeuft", color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
  queued: { label: "Wartend", color: "var(--color-text-dim)", bg: "var(--color-border)" },
  failed: { label: "Fehler", color: "var(--color-red)", bg: "rgba(248,113,113,0.1)" },
  draft: { label: "Entwurf", color: "var(--color-text-dim)", bg: "rgba(90,90,114,0.1)" },
};

const PRESET_LABELS: Record<string, string> = {
  dach_allgemein: "DACH", solo_unternehmer: "Solo", ecom_kaeufer: "E-Com",
  b2b_entscheider: "B2B", gen_z: "Gen Z",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Neue Simulationen laden
  const { data: simulations } = await supabase
    .from("simulations")
    .select("id, name, sim_type, status, agent_count, created_at, completed_at, persona_preset")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Alte Runs auch laden (falls vorhanden)
  const { data: legacyRuns } = await supabase
    .from("runs")
    .select("id, stimulus_type, status, agent_count, created_at, completed_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Zusammenführen und nach Datum sortieren
  const allItems = [
    ...(simulations ?? []).map(s => ({
      id: s.id, name: s.name as string | null, type: s.sim_type, status: s.status,
      agentCount: s.agent_count, createdAt: s.created_at,
      preset: s.persona_preset as string | null, isNew: true,
    })),
    ...(legacyRuns ?? []).map(r => ({
      id: r.id, name: null as string | null, type: r.stimulus_type, status: r.status,
      agentCount: r.agent_count, createdAt: r.created_at,
      preset: null as string | null, isNew: false,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  const runsUsed = profile?.runs_used ?? 0;
  const runsLimit = profile?.runs_limit ?? 3;
  const plan = profile?.simtest_plan ?? "free";
  const remaining = Math.max(0, runsLimit - runsUsed);
  const usagePercent = runsLimit > 0 ? (runsUsed / runsLimit) * 100 : 0;

  const stats = [
    {
      label: "Plan", value: plan, capitalize: true, color: "#a78bfa",
      icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
    },
    {
      label: "Simulationen", value: `${runsUsed} / ${runsLimit}`, color: "#60a5fa",
      icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    },
    {
      label: "Verbleibend", value: remaining.toString(), color: "#6ee7b7",
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
              boxShadow: usagePercent > 0 ? "0 0 12px var(--color-accent-glow)" : "none",
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="animate-slide-up" style={{ animationDelay: "320ms" }}>
        <Link href="/simulation/new" className="btn-primary inline-flex items-center gap-2.5 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Neue Simulation starten
        </Link>
      </div>

      {/* Simulationen */}
      <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>
          Letzte Simulationen
        </h2>
        {allItems.length === 0 ? (
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
            {allItems.map((item) => {
              const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.queued;
              const typeColor = TYPE_COLORS[item.type] ?? "var(--color-accent)";
              const displayName = item.name ?? TYPE_LABELS[item.type] ?? item.type;
              const date = new Date(item.createdAt);
              const href = item.isNew
                ? `/simulation/${item.id}`
                : (item.status === "done" ? `/run/${item.id}/report` : `/run/${item.id}`);
              const isClickable = item.status === "completed" || item.status === "done" || item.status === "running";

              return (
                <Link
                  key={item.id}
                  href={isClickable ? href : "#"}
                  className="card flex items-center gap-4 p-4 transition-all duration-150 hover:border-accent group"
                  style={{ cursor: isClickable ? "pointer" : "default" }}
                >
                  {/* Typ-Indikator */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${typeColor}15` }}>
                    <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: typeColor }}>
                      {(TYPE_LABELS[item.type] ?? item.type).slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Name + Meta */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block group-hover:text-accent transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                      {displayName}
                    </span>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                      <span>{date.toLocaleDateString("de-DE")} {date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span>{item.agentCount} Agenten</span>
                      {item.preset && <span>{PRESET_LABELS[item.preset] ?? item.preset}</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0" style={{
                    fontFamily: "var(--font-mono)",
                    color: status.color,
                    background: status.bg,
                  }}>
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

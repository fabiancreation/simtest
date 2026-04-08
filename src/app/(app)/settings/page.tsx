import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const plan = profile?.simtest_plan ?? "free";
  const runsUsed = profile?.runs_used ?? 0;
  const runsLimit = profile?.runs_limit ?? 3;

  const infoItems = [
    { label: "E-Mail", value: user.email ?? "", mono: true },
    { label: "Plan", value: plan, capitalize: true },
    { label: "Runs diesen Monat", value: `${runsUsed} / ${runsLimit}`, mono: true },
    { label: "User-ID", value: user.id.slice(0, 8) + "...", mono: true, dim: true },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Einstellungen
        </h1>
        <p className="text-text-muted mt-1 text-sm">Dein Konto und Plan</p>
      </div>

      {/* Account Info */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="icon-glow" style={{ "--glow-color": "rgba(167,139,250,0.1)" } as React.CSSProperties}>
            <svg className="w-5 h-5 text-purple" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Konto</h3>
        </div>
        <div className="space-y-0">
          {infoItems.map((item, i) => (
            <div key={i} className={`flex items-center justify-between py-3.5 ${i < infoItems.length - 1 ? "border-b border-border" : ""}`}>
              <span className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                {item.label}
              </span>
              <span className={`text-sm ${item.dim ? "text-text-dim" : "text-text"} ${item.capitalize ? "capitalize" : ""}`} style={item.mono ? { fontFamily: "var(--font-mono)" } : undefined}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Upgrade */}
      <div className="card p-6 animate-slide-up" style={{ animationDelay: "160ms" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="icon-glow" style={{ "--glow-color": "rgba(110,231,183,0.1)" } as React.CSSProperties}>
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Plan upgraden</h3>
        </div>
        <p className="text-sm text-text-muted mb-5">
          Stripe-Integration wird in Phase 2 aktiviert. Aktuell ist der Free-Plan mit 3 Runs/Monat aktiv.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Starter", price: "12", runs: "15", color: "#6ee7b7" },
            { name: "Pro", price: "34", runs: "50", color: "#a78bfa" },
            { name: "Business", price: "89", runs: "200", color: "#60a5fa" },
          ].map(tier => (
            <div key={tier.name} className="rounded-xl p-4 text-center" style={{
              background: `${tier.color}06`,
              border: `1px solid ${tier.color}20`,
            }}>
              <p className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>{tier.name}</p>
              <p className="text-lg font-bold mt-1" style={{ fontFamily: "var(--font-display)", color: tier.color }}>
                {tier.price}<span className="text-xs text-text-dim font-normal">/Mo</span>
              </p>
              <p className="text-xs text-text-dim mt-1">{tier.runs} Runs</p>
            </div>
          ))}
        </div>
        <button
          disabled
          className="mt-4 w-full rounded-lg py-2.5 text-sm font-medium cursor-not-allowed" style={{
            background: "rgba(110,231,183,0.06)",
            border: "1px solid rgba(110,231,183,0.15)",
            color: "var(--color-accent)",
            fontFamily: "var(--font-display)",
            opacity: 0.6,
          }}
        >
          Bald verfügbar
        </button>
      </div>
    </div>
  );
}

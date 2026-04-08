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
  const plan = profile?.plan ?? "free";

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-muted mt-1">Willkommen bei SimTest</p>
      </div>

      {/* Kontingent */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <p className="text-sm text-text-muted">Plan</p>
          <p className="mt-1 text-lg font-semibold capitalize">{plan}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <p className="text-sm text-text-muted">Runs diesen Monat</p>
          <p className="mt-1 text-lg font-semibold">
            {runsUsed} / {runsLimit}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <p className="text-sm text-text-muted">Verbleibend</p>
          <p className="mt-1 text-lg font-semibold text-accent">
            {Math.max(0, runsLimit - runsUsed)}
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/run/new"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-medium text-bg hover:bg-accent-dim transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Neue Simulation starten
      </Link>

      {/* Letzte Runs */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Letzte Simulationen</h2>
        {!recentRuns?.length ? (
          <p className="text-text-muted">Noch keine Simulationen. Starte deine erste!</p>
        ) : (
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                href={`/run/${run.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-card p-4 hover:bg-bg-card-hover transition-colors"
              >
                <div>
                  <span className="text-sm font-medium capitalize">{run.stimulus_type}</span>
                  <span className="ml-3 text-xs text-text-dim">
                    {new Date(run.created_at).toLocaleDateString("de-DE")}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    run.status === "done"
                      ? "bg-accent/10 text-accent"
                      : run.status === "running"
                      ? "bg-blue/10 text-blue"
                      : run.status === "failed"
                      ? "bg-red/10 text-red"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {run.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

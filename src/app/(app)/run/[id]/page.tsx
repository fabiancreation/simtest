"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface RunStatus {
  id: string;
  status: string;
  stimulus_type: string;
  agent_count: number;
  created_at: string;
  completed_at: string | null;
}

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [run, setRun] = useState<RunStatus | null>(null);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    async function poll() {
      const res = await fetch(`/api/runs/${params.id}/status`);
      if (!res.ok) return;
      const data: RunStatus = await res.json();
      setRun(data);

      if (data.status === "done") {
        router.push(`/run/${params.id}/report`);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [params.id, router]);

  useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  const typeLabels: Record<string, string> = { copy: "Copy Test", product: "Produkt-Check", strategy: "Strategie-Check" };

  return (
    <div className="max-w-lg mx-auto mt-16 text-center space-y-8 animate-slide-up">
      {!run ? (
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-border animate-pulse" />
          <p className="text-text-muted text-sm">Lade...</p>
        </div>
      ) : run.status === "failed" ? (
        <>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{
            background: "rgba(248,113,113,0.1)",
            boxShadow: "0 0 40px rgba(248,113,113,0.08)",
          }}>
            <svg className="w-10 h-10 text-red" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>Simulation fehlgeschlagen</h1>
            <p className="text-text-muted text-sm mt-2">
              Beim Ausführen der Simulation ist ein Fehler aufgetreten. Bitte versuche es erneut.
            </p>
          </div>
          <button onClick={() => router.push("/run/new")} className="btn-primary text-sm">
            Neue Simulation
          </button>
        </>
      ) : (
        <>
          {/* Animated Icon */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-2xl animate-glow" style={{
              background: "rgba(110,231,183,0.06)",
              border: "1px solid rgba(110,231,183,0.15)",
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            {/* Orbiting dots */}
            {[0, 1, 2].map(i => (
              <div key={i} className="absolute w-2 h-2 rounded-full bg-accent" style={{
                top: "50%", left: "50%",
                transform: `rotate(${120 * i + dots * 30}deg) translateX(44px) translateY(-50%)`,
                opacity: 0.4 + (i * 0.2),
                transition: "transform 0.5s ease",
                boxShadow: "0 0 8px rgba(110,231,183,0.4)",
              }} />
            ))}
          </div>

          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800 }}>
              Simulation läuft{".".repeat(dots)}
            </h1>
            <p className="text-text-muted text-sm mt-2">
              {run.agent_count} Agenten reagieren auf deine Varianten
            </p>
          </div>

          {/* Info Card */}
          <div className="card p-5 text-left mx-auto max-w-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>TYP</span>
              <span className="text-sm text-text-muted">{typeLabels[run.stimulus_type] ?? run.stimulus_type}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>AGENTEN</span>
              <span className="text-sm text-text-muted" style={{ fontFamily: "var(--font-mono)" }}>{run.agent_count}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>STATUS</span>
              <span className="badge" style={{ background: "rgba(96,165,250,0.1)", color: "var(--color-blue)" }}>
                {run.status === "running" ? "Läuft" : "Wartend"}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="max-w-xs mx-auto">
            <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: "70%",
                background: "linear-gradient(90deg, var(--color-accent-dim), var(--color-accent))",
                animation: "progressPulse 2s ease-in-out infinite",
              }} />
            </div>
            <p className="text-xs text-text-dim mt-3">
              Du wirst automatisch zum Report weitergeleitet.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

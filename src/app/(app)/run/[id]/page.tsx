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

  useEffect(() => {
    async function poll() {
      const res = await fetch(`/api/runs/${params.id}/status`);
      if (!res.ok) return;
      const data: RunStatus = await res.json();
      setRun(data);

      if (data.status === "done") {
        router.push(`/run/${params.id}/report`);
      } else if (data.status === "failed") {
        // Bleibt auf dieser Seite mit Fehler-Anzeige
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [params.id, router]);

  return (
    <div className="max-w-lg mx-auto mt-20 text-center space-y-6">
      {!run ? (
        <p className="text-text-muted">Lade...</p>
      ) : run.status === "failed" ? (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-red/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Simulation fehlgeschlagen</h1>
          <p className="text-text-muted">
            Beim Ausfuehren der Simulation ist ein Fehler aufgetreten.
          </p>
          <button
            onClick={() => router.push("/run/new")}
            className="rounded-lg bg-accent px-6 py-3 font-medium text-bg hover:bg-accent-dim transition-colors"
          >
            Neue Simulation
          </button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Simulation läuft</h1>
          <p className="text-text-muted">
            {run.agent_count} Agenten reagieren auf deine Varianten...
          </p>
          <div className="w-full bg-border rounded-full h-2">
            <div className="bg-accent h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
          <p className="text-xs text-text-dim">
            Du wirst automatisch zum Report weitergeleitet.
          </p>
        </>
      )}
    </div>
  );
}

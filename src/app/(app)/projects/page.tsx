"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PROJECT_COLORS } from "@/types/simulation";

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  simulations: { count: number }[];
  persona_profiles: { count: number }[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name, description, color, created_at, simulations(count), persona_profiles(count)")
        .order("created_at", { ascending: false });
      if (data) setProjects(data as unknown as ProjectItem[]);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Projekt wirklich loeschen? Simulationen und Personas bleiben erhalten, verlieren aber die Zuordnung.")) return;
    setDeleting(id);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="w-12 h-12 mx-auto rounded-full animate-pulse" style={{ background: "var(--color-border)" }} />
        <p className="text-text-muted text-sm mt-4">Lade Projekte...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Projekte
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            {projects.length} Projekt{projects.length !== 1 ? "e" : ""}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary text-sm">
          + Neues Projekt
        </Link>
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="card p-10 text-center animate-slide-up">
          <div className="icon-glow mx-auto mb-4" style={{ "--glow-color": "rgba(110,231,183,0.1)" } as React.CSSProperties}>
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <p className="text-text-muted text-sm">Noch keine Projekte angelegt.</p>
          <p className="text-text-dim text-xs mt-1 mb-4">Projekte gruppieren deine Simulationen und Personas und liefern Kontext fuer bessere Ergebnisse.</p>
          <Link href="/projects/new" className="btn-primary text-sm inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Erstes Projekt erstellen
          </Link>
        </div>
      )}

      {/* Project List */}
      {projects.length > 0 && (
        <div className="space-y-3 stagger">
          {projects.map((p) => {
            const simCount = p.simulations?.[0]?.count ?? 0;
            const personaCount = p.persona_profiles?.[0]?.count ?? 0;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="card-interactive card p-5 cursor-pointer animate-slide-up block group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Color Dot */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{
                      background: `${p.color}20`,
                    }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-accent transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-sm text-text-muted mt-1 line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                          {simCount} Simulation{simCount !== 1 ? "en" : ""}
                        </span>
                        <span className="text-[10px] text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                          {personaCount} Persona{personaCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(p.id); }}
                    disabled={deleting === p.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 cursor-pointer shrink-0"
                    style={{ color: "var(--color-red)" }}
                    title="Projekt loeschen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
                <div className="mt-3" style={{ paddingLeft: 52 }}>
                  <p className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                    {new Date(p.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

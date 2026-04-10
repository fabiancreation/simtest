"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PROJECT_COLORS } from "@/types/simulation";

interface ProjectData {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

interface SimItem {
  id: string;
  name: string | null;
  sim_type: string;
  status: string;
  created_at: string;
}

interface PersonaItem {
  id: string;
  name: string;
  description: string;
  priority: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  copy: "Copy Test", product: "Produkt-Check", pricing: "Pricing Test",
  ad: "Ad Creative", landing: "Landing Page", campaign: "Kampagnen-Check",
  crisis: "Krisentest", strategy: "Strategie",
};

const TYPE_COLORS: Record<string, string> = {
  copy: "#10B981", product: "#6366F1", pricing: "#F59E0B",
  ad: "#EC4899", landing: "#0EA5E9", campaign: "#8B5CF6",
  crisis: "#EF4444", strategy: "#14B8A6",
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [simulations, setSimulations] = useState<SimItem[]>([]);
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Project
      const { data: proj } = await supabase
        .from("projects").select("*").eq("id", id).single();
      if (!proj) { router.push("/projects"); return; }
      setProject(proj);
      setName(proj.name);
      setDescription(proj.description);
      setColor(proj.color);

      // Simulations in this project
      const { data: sims } = await supabase
        .from("simulations")
        .select("id, name, sim_type, status, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      if (sims) setSimulations(sims);

      // Personas in this project
      const { data: pers } = await supabase
        .from("persona_profiles")
        .select("id, name, description, priority")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      if (pers) setPersonas(pers);

      setLoading(false);
    }
    load();
  }, [id, router]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
      if (res.ok) {
        setProject(prev => prev ? { ...prev, name, description, color } : prev);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || !project) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="w-12 h-12 mx-auto rounded-full animate-pulse" style={{ background: "var(--color-border)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <Link href="/projects" className="text-xs text-text-dim hover:text-text-muted transition-colors mb-3 inline-flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Projekte
        </Link>

        {editing ? (
          <div className="space-y-4 mt-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full text-lg font-bold"
              style={{ fontFamily: "var(--font-display)" }}
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full"
              rows={5}
              placeholder="Beschreibung (Branche, Zielmarkt, USP, Tonalitaet...)"
            />
            <div>
              <label className="block text-sm font-medium mb-1.5">Farbe</label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: c,
                      boxShadow: color === c ? `0 0 0 2px var(--color-bg), 0 0 0 3px ${c}` : "none",
                      transform: color === c ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                {saving ? "Speichere..." : "Speichern"}
              </button>
              <button onClick={() => { setEditing(false); setName(project.name); setDescription(project.description); setColor(project.color); }}
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors cursor-pointer">
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full shrink-0" style={{ background: project.color }} />
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
                {project.name}
              </h1>
              <button onClick={() => setEditing(true)} className="text-text-dim hover:text-accent transition-colors cursor-pointer p-1" title="Bearbeiten">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </button>
            </div>
            {project.description && (
              <p className="text-text-muted text-sm mt-2 whitespace-pre-line">{project.description}</p>
            )}
            {!project.description && (
              <p className="text-text-dim text-sm mt-2 italic">
                Keine Beschreibung.{" "}
                <button onClick={() => setEditing(true)} className="text-accent hover:underline cursor-pointer">Hinzufuegen</button>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 animate-slide-up" style={{ animationDelay: "60ms" }}>
        <Link href={`/simulation/new?project=${id}`} className="btn-primary text-sm inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Neue Simulation
        </Link>
        <Link href={`/personas/new?project=${id}`} className="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
          style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Persona erstellen
        </Link>
      </div>

      {/* Simulations */}
      <div className="animate-slide-up" style={{ animationDelay: "120ms" }}>
        <h2 className="text-sm font-semibold text-text-muted mb-3" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          SIMULATIONEN ({simulations.length})
        </h2>
        {simulations.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-text-dim text-sm">Noch keine Simulationen in diesem Projekt.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {simulations.map((s) => {
              const typeColor = TYPE_COLORS[s.sim_type] ?? "var(--color-accent)";
              return (
                <Link key={s.id} href={`/simulation/${s.id}`}
                  className="card flex items-center gap-3 p-3 transition-all hover:border-accent cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeColor}15` }}>
                    <span className="text-[10px] font-bold" style={{ fontFamily: "var(--font-mono)", color: typeColor }}>
                      {(TYPE_LABELS[s.sim_type] ?? s.sim_type).slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block group-hover:text-accent transition-colors">
                      {s.name ?? TYPE_LABELS[s.sim_type] ?? s.sim_type}
                    </span>
                    <span className="text-[10px] text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                      {new Date(s.created_at).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Personas */}
      <div className="animate-slide-up" style={{ animationDelay: "180ms" }}>
        <h2 className="text-sm font-semibold text-text-muted mb-3" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          PERSONAS ({personas.length})
        </h2>
        {personas.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-text-dim text-sm">Noch keine Personas in diesem Projekt.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {personas.map((p) => (
              <Link key={p.id} href={`/personas/${p.id}`}
                className="card flex items-center gap-3 p-3 transition-all hover:border-accent cursor-pointer group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
                  background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(96,165,250,0.1))",
                }}>
                  <svg className="w-4 h-4 text-purple" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate group-hover:text-accent transition-colors">{p.name}</span>
                    {p.priority && (
                      <span className="badge" style={{
                        fontSize: 9,
                        background: p.priority === "primary" ? "var(--color-accent-glow)" : "rgba(96,165,250,0.1)",
                        color: p.priority === "primary" ? "var(--color-accent)" : "var(--color-blue)",
                      }}>
                        {p.priority === "primary" ? "Primaer" : p.priority === "secondary" ? "Sekundaer" : "Nische"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-dim line-clamp-1">{p.description}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
